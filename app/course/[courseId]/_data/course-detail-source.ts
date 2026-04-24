import { prisma } from "@/lib/prisma";
import { CourseDetailData, DimensionScore } from "../_types";

interface CourseDetailRecord extends Omit<CourseDetailData, "initialReviews" | "topReviews"> {
  reviews: CourseDetailData["initialReviews"]["items"];
}

const EMPTY_DIMENSION_LABELS: Array<{ key: string; label: string }> = [
  { key: "attitude", label: "教学态度与师德" },
  { key: "content", label: "教学内容与设计" },
  { key: "method", label: "教学方法与技巧" },
  { key: "effect", label: "教学效果与成果" },
  { key: "interaction", label: "师生互动与氛围" },
  { key: "resource", label: "课程资源与评价" },
  { key: "improve", label: "教学创新与改进" },
];

function normalizeScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Number(value.toFixed(2));
}

function buildSevenScores(input: {
  overall: number;
  attitude?: number | null;
  content?: number | null;
  method?: number | null;
  effect?: number | null;
  interaction?: number | null;
  resource?: number | null;
  improve?: number | null;
}): DimensionScore[] {
  const fallback = normalizeScore(input.overall);
  const scoreMap: Record<string, number> = {
    attitude: normalizeScore(input.attitude ?? fallback),
    content: normalizeScore(input.content ?? fallback),
    method: normalizeScore(input.method ?? fallback),
    effect: normalizeScore(input.effect ?? fallback),
    interaction: normalizeScore(input.interaction ?? fallback),
    resource: normalizeScore(input.resource ?? fallback),
    improve: normalizeScore(input.improve ?? fallback),
  };

  return EMPTY_DIMENSION_LABELS.map((item) => ({
    key: item.key,
    label: item.label,
    score: scoreMap[item.key],
  }));
}

function parseTeacherName(subtitle: string | null | undefined) {
  const normalized = (subtitle ?? "").trim();
  if (!normalized) {
    return "待补充";
  }

  const candidates = normalized
    .split(/[|｜/,-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return candidates[candidates.length - 1] ?? normalized;
}

export async function getCourseSource(courseId: string): Promise<CourseDetailRecord> {
  const [courseProfile, courseDoc, latestHistory, reviewAggregate, announcements] = await Promise.all([
    prisma.courseProfile.findUnique({
      where: {
        courseId,
      },
      select: {
        courseName: true,
        teacherName: true,
        intro: true,
        location: true,
        schedule: true,
      },
    }),
    prisma.searchDocument.findUnique({
      where: {
        docType_docId: {
          docType: "COURSE",
          docId: courseId,
        },
      },
      select: {
        title: true,
        subtitle: true,
        snippet: true,
        scoreSnapshot: true,
      },
    }),
    prisma.courseScoreHistory.findFirst({
      where: {
        courseId,
        granularity: "SEMESTER",
      },
      orderBy: [{ sortOrder: "desc" }],
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
    }),
    prisma.courseReview.aggregate({
      where: {
        courseId,
        status: "VISIBLE",
      },
      _avg: {
        overallScore: true,
      },
    }),
    prisma.courseAnnouncement.findMany({
      where: {
        courseId,
        status: "PUBLISHED",
      },
      orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        content: true,
        publishAt: true,
      },
    }),
  ]);

  const recentOverallScore = normalizeScore(
    latestHistory?.overallScore ?? reviewAggregate._avg.overallScore ?? courseDoc?.scoreSnapshot,
  );

  return {
    courseId,
    courseName: courseProfile?.courseName?.trim() || courseDoc?.title?.trim() || `课程 ${courseId}`,
    teacher: courseProfile?.teacherName?.trim() || parseTeacherName(courseDoc?.subtitle),
    intro: courseProfile?.intro?.trim() || courseDoc?.snippet?.trim() || "暂无课程简介",
    location: courseProfile?.location?.trim() || "待补充",
    time: courseProfile?.schedule?.trim() || "待补充",
    recentOverallScore,
    recentSevenScores: buildSevenScores({
      overall: recentOverallScore,
      attitude: latestHistory?.attitude,
      content: latestHistory?.content,
      method: latestHistory?.method,
      effect: latestHistory?.effect,
      interaction: latestHistory?.interaction,
      resource: latestHistory?.resource,
      improve: latestHistory?.improve,
    }),
    announcements: announcements.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      publishAt: item.publishAt.toISOString().slice(0, 10),
    })),
    resources: [],
    reviews: [],
  };
}
