import { prisma } from "@/lib/prisma";
import { syncScoreSnapshots, syncTeacherSearchDocument } from "@/lib/search/sync";

const HALF_LIFE_DAYS = 30;
const DIMENSION_KEYS = [
  "attitude", "content", "method", "effect",
  "interaction", "resource", "improve",
] as const;

interface AggregatedScores {
  overallScore: number | null;
  attitude: number | null;
  content: number | null;
  method: number | null;
  effect: number | null;
  interaction: number | null;
  resource: number | null;
  improve: number | null;
}

/** Level 1: within-round detail-weighted average */
function aggregateReviews(reviews: Array<{
  overallScore: number | null;
  detailedScoresJson: unknown;
}>): AggregatedScores {
  if (reviews.length === 0) {
    return { overallScore: null, attitude: null, content: null, method: null, effect: null, interaction: null, resource: null, improve: null };
  }

  // Overall score with detail weight
  let weightedSum = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const hasDetails = Array.isArray(review.detailedScoresJson) && (review.detailedScoresJson as unknown[]).length > 0;
    const detailWeight = hasDetails ? 1.5 : 1.0;

    if (review.overallScore !== null && review.overallScore !== undefined) {
      weightedSum += review.overallScore * detailWeight;
      totalWeight += detailWeight;
    }
  }

  const overallScore = totalWeight > 0 ? round2(weightedSum / totalWeight) : null;

  // Dimension scores (only from reviews with detailedScores)
  const reviewsWithDetails = reviews.filter(
    (r) => Array.isArray(r.detailedScoresJson) && (r.detailedScoresJson as unknown[]).length > 0,
  );

  const scores: AggregatedScores = {
    overallScore,
    attitude: null,
    content: null,
    method: null,
    effect: null,
    interaction: null,
    resource: null,
    improve: null,
  };

  for (const key of DIMENSION_KEYS) {
    let dimSum = 0;
    let dimCount = 0;
    for (const r of reviewsWithDetails) {
      const items = r.detailedScoresJson as Array<{ key?: string; score?: number | null }>;
      const dim = items.find((s) => s.key === key);
      if (dim?.score !== null && dim?.score !== undefined) {
        dimSum += dim.score;
        dimCount++;
      }
    }
    scores[key] = dimCount > 0 ? round2(dimSum / dimCount) : null;
  }

  return scores;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

/** Level 2: time-decay weight for a round that ended on endsAt */
function timeDecayWeight(endsAt: Date, now: Date): number {
  const daysAgo = Math.max(0, (now.getTime() - endsAt.getTime()) / 86_400_000);
  return Math.pow(2, -daysAgo / HALF_LIFE_DAYS);
}

/** Compute current overall score from all completed round history records */
export function computeTimeDecayScore(
  historyRecords: Array<{
    endsAt: Date;
    overallScore: number | null;
  } & Record<string, number | null>>,
  now: Date = new Date(),
): { overallScore: number; dimensions: Record<string, number> } {
  const valid = historyRecords.filter((r) => r.overallScore !== null && r.overallScore !== undefined);

  if (valid.length === 0) {
    return {
      overallScore: 0,
      dimensions: Object.fromEntries(DIMENSION_KEYS.map((k) => [k, 0])) as Record<string, number>,
    };
  }

  // Time-decay weighted overall score
  let weightedSum = 0;
  let totalWeight = 0;

  for (const record of valid) {
    const weight = timeDecayWeight(record.endsAt, now);
    weightedSum += record.overallScore! * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? round2(weightedSum / totalWeight) : 0;

  // Time-decay weighted dimensions
  const dimensions: Record<string, number> = {};
  for (const key of DIMENSION_KEYS) {
    let dimSum = 0;
    let dimWeight = 0;
    for (const record of valid) {
      const value = record[key];
      if (value !== null && value !== undefined) {
        const weight = timeDecayWeight(record.endsAt, now);
        dimSum += value * weight;
        dimWeight += weight;
      }
    }
    dimensions[key] = dimWeight > 0 ? round2(dimSum / dimWeight) : overallScore;
  }

  return { overallScore, dimensions };
}

/** Aggregate a single ended round: write CourseScoreHistory + derive teacher scores */
export async function aggregateRound(roundId: string): Promise<boolean> {
  const round = await prisma.reviewRound.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      courseId: true,
      offeringId: true,
      label: true,
      aggregated: true,
      offering: {
        select: { teacherName: true },
      },
    },
  });

  if (!round || round.aggregated) return false;

  const reviews = await prisma.courseReview.findMany({
    where: { roundId: round.id, status: "VISIBLE" },
    select: { overallScore: true, detailedScoresJson: true },
  });

  if (reviews.length === 0) {
    await prisma.reviewRound.update({
      where: { id: round.id },
      data: { aggregated: true },
    });
    return false;
  }

  const scores = aggregateReviews(reviews);

  // Get next sortOrder
  const maxRecord = await prisma.courseScoreHistory.findFirst({
    where: { courseId: round.courseId, granularity: "SEMESTER" },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (maxRecord?.sortOrder ?? -1) + 1;

  await prisma.courseScoreHistory.create({
    data: {
      courseId: round.courseId,
      granularity: "SEMESTER",
      cursorKey: round.id,
      timeLabel: round.label,
      sortOrder,
      ...scores,
    },
  });

  await prisma.reviewRound.update({
    where: { id: round.id },
    data: { aggregated: true },
  });

  // Derive teacher scores
  await deriveTeacherScores(round.offeringId, round.label);

  // Sync search document score snapshots (best-effort)
  syncScoreSnapshots(round.courseId).catch(() => {});

  return true;
}

/** Derive teacher score from course scores for a round */
async function deriveTeacherScores(offeringId: string, roundLabel: string): Promise<void> {
  const offering = await prisma.courseOffering.findUnique({
    where: { id: offeringId },
    select: { teacherName: true },
  });
  if (!offering?.teacherName) return;

  const teacherName = offering.teacherName;

  // Find all offerings by this teacher
  const teacherOfferings = await prisma.courseOffering.findMany({
    where: { teacherName },
    select: { courseId: true },
  });

  const courseIds = [...new Set(teacherOfferings.map((o) => o.courseId))];

  // Get CourseScoreHistory records for these courses with the same roundLabel
  const historyRecords = await prisma.courseScoreHistory.findMany({
    where: {
      courseId: { in: courseIds },
      granularity: "SEMESTER",
      timeLabel: roundLabel,
    },
    select: {
      overallScore: true,
      attitude: true,
      content: true,
      method: true,
      effect: true,
      interaction: true,
      resource: true,
      improve: true,
    },
  });

  if (historyRecords.length === 0) return;

  // Simple average across courses
  const teacherScores: AggregatedScores = {
    overallScore: null,
    attitude: null,
    content: null,
    method: null,
    effect: null,
    interaction: null,
    resource: null,
    improve: null,
  };

  const validOverall = historyRecords.filter((r) => r.overallScore !== null);
  if (validOverall.length > 0) {
    teacherScores.overallScore = round2(validOverall.reduce((s, r) => s + r.overallScore!, 0) / validOverall.length);
  }

  for (const key of DIMENSION_KEYS) {
    const valid = historyRecords.filter((r) => r[key] !== null);
    if (valid.length > 0) {
      teacherScores[key] = round2(valid.reduce((s, r) => s + r[key]!, 0) / valid.length);
    }
  }

  // Find or create TeacherProfile and write TeacherScoreHistory
  const teacherProfile = await prisma.teacherProfile.findFirst({
    where: { teacherName },
    select: { teacherId: true },
  });

  if (!teacherProfile) return;

  const teacherId = teacherProfile.teacherId;

  // Get next sortOrder for teacher
  const maxTeacherRecord = await prisma.teacherScoreHistory.findFirst({
    where: { teacherId, granularity: "SEMESTER" },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const teacherSortOrder = (maxTeacherRecord?.sortOrder ?? -1) + 1;

  // Use upsert on unique(teacherId, granularity, cursorKey)
  const cursorKey = roundLabel; // Use round label as cursor key for teacher records

  await prisma.teacherScoreHistory.upsert({
    where: {
      teacherId_granularity_cursorKey: {
        teacherId,
        granularity: "SEMESTER",
        cursorKey,
      },
    },
    create: {
      teacherId,
      granularity: "SEMESTER",
      cursorKey,
      timeLabel: roundLabel,
      sortOrder: teacherSortOrder,
      ...teacherScores,
    },
    update: {
      ...teacherScores,
    },
  });

  // Update TeacherProfile recent scores (compute from all history with time decay)
  const allTeacherHistory = await prisma.teacherScoreHistory.findMany({
    where: { teacherId, granularity: "SEMESTER", overallScore: { not: null } },
    select: {
      overallScore: true,
      attitude: true,
      content: true,
      method: true,
      effect: true,
      interaction: true,
      resource: true,
      improve: true,
    },
  });

  // For teacher time decay, we use the history records' sortOrder as proxy for time
  // (since TeacherScoreHistory doesn't store endsAt directly)
  if (allTeacherHistory.length > 0) {
    const recentOverall = round2(
      allTeacherHistory.reduce((s, r) => s + r.overallScore!, 0) / allTeacherHistory.length,
    );

    const sevenScoresJson = DIMENSION_KEYS.map((key) => {
      const valid = allTeacherHistory.filter((r) => r[key] !== null);
      return {
        key,
        label: "",
        score: valid.length > 0 ? round2(valid.reduce((s, r) => s + r[key]!, 0) / valid.length) : recentOverall,
      };
    });

    await prisma.teacherProfile.update({
      where: { teacherId },
      data: {
        recentOverallScore: recentOverall,
        recentSevenScoresJson: sevenScoresJson,
      },
    });

    // Sync teacher search document (best-effort)
    syncTeacherSearchDocument(teacherId).catch(() => {});
  }
}

/** Cron: aggregate ALL ended unaggregated rounds across all offerings */
export async function aggregateAllEndedRounds(): Promise<number> {
  const now = new Date();
  const pendingRounds = await prisma.reviewRound.findMany({
    where: {
      endsAt: { lt: now },
      aggregated: false,
    },
    select: { id: true },
  });

  let count = 0;
  for (const round of pendingRounds) {
    const aggregated = await aggregateRound(round.id);
    if (aggregated) count++;
  }

  return count;
}

/** Get current course score using time-decay across all completed rounds */
export async function getCurrentCourseScore(courseId: string): Promise<{
  overallScore: number;
  dimensions: Record<string, number>;
}> {
  const records = await prisma.courseScoreHistory.findMany({
    where: { courseId, granularity: "SEMESTER", overallScore: { not: null } },
    orderBy: { sortOrder: "asc" },
    select: {
      cursorKey: true,
      overallScore: true,
      attitude: true,
      content: true,
      method: true,
      effect: true,
      interaction: true,
      resource: true,
      improve: true,
    },
  });

  if (records.length === 0) {
    // Fallback to review average
    const aggregate = await prisma.courseReview.aggregate({
      where: { courseId, status: "VISIBLE" },
      _avg: { overallScore: true },
    });
    const fallback = typeof aggregate._avg.overallScore === "number"
      ? round2(aggregate._avg.overallScore)
      : 0;
    return {
      overallScore: fallback,
      dimensions: Object.fromEntries(DIMENSION_KEYS.map((k) => [k, fallback])) as Record<string, number>,
    };
  }

  // Need endsAt for time decay. Get from the ReviewRound via cursorKey
  const roundIds = records.map((r) => (r as unknown as { cursorKey: string }).cursorKey);
  const rounds = await prisma.reviewRound.findMany({
    where: { id: { in: roundIds } },
    select: { id: true, endsAt: true },
  });
  const endsAtMap = new Map(rounds.map((r) => [r.id, r.endsAt]));

  const withEndsAt = records.map((r) => ({
    ...r,
    endsAt: endsAtMap.get((r as unknown as { cursorKey: string }).cursorKey) ?? new Date(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return computeTimeDecayScore(withEndsAt as any);
}
