import { prisma } from "@/lib/prisma";
import { computeTimeDecayScore } from "@/lib/score-history/aggregator";

function buildSearchableText(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

export async function syncCourseSearchDocument(courseId: string): Promise<void> {
  try {
    const course = await prisma.courseProfile.findUnique({
      where: { courseId },
      select: {
        courseName: true,
        teacherName: true,
        intro: true,
      },
    });

    if (!course) {
      // Course deleted — remove from search
      await prisma.searchDocument.deleteMany({ where: { docType: "COURSE", docId: courseId } });
      return;
    }

    // Get current score
    let scoreSnapshot = 0;
    let reviewCountSnapshot = 0;
    try {
      const historyRecords = await prisma.courseScoreHistory.findMany({
        where: { courseId, granularity: "SEMESTER", overallScore: { not: null } },
        orderBy: { sortOrder: "asc" },
        select: { cursorKey: true, overallScore: true, attitude: true, content: true, method: true, effect: true, interaction: true, resource: true, improve: true },
      });

      if (historyRecords.length > 0) {
        const roundIds = historyRecords.map((r) => (r as unknown as { cursorKey: string }).cursorKey);
        const rounds = await prisma.reviewRound.findMany({
          where: { id: { in: roundIds } },
          select: { id: true, endsAt: true },
        });
        const endsAtMap = new Map(rounds.map((r) => [r.id, r.endsAt]));
        const withEndsAt = historyRecords.map((r) => ({
          ...r,
          endsAt: endsAtMap.get((r as unknown as { cursorKey: string }).cursorKey) ?? new Date(),
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = computeTimeDecayScore(withEndsAt as any);
        scoreSnapshot = result.overallScore;
      }

      const countResult = await prisma.courseReview.count({
        where: { courseId, status: "VISIBLE" },
      });
      reviewCountSnapshot = countResult;
    } catch {
      // Score computation is best-effort
    }

    const searchableText = buildSearchableText([
      course.courseName,
      course.teacherName,
      truncate(course.intro, 300),
    ]);

    await prisma.searchDocument.upsert({
      where: { docType_docId: { docType: "COURSE", docId: courseId } },
      create: {
        docType: "COURSE",
        docId: courseId,
        title: course.courseName,
        subtitle: `任课教师：${course.teacherName}`,
        department: "",
        scoreSnapshot,
        reviewCountSnapshot,
        snippet: truncate(course.intro, 200),
        searchableText,
      },
      update: {
        title: course.courseName,
        subtitle: `任课教师：${course.teacherName}`,
        scoreSnapshot,
        reviewCountSnapshot,
        snippet: truncate(course.intro, 200),
        searchableText,
      },
    });
  } catch {
    // Best-effort sync, don't block the main flow
  }
}

export async function syncTeacherSearchDocument(teacherId: string): Promise<void> {
  try {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { teacherId },
      select: {
        teacherName: true,
        department: true,
        title: true,
        researchAreas: true,
        description: true,
        recentOverallScore: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { name: true },
    });

    const teacherName = teacher?.teacherName ?? user?.name ?? "未命名教师";

    if (!teacher && !user) {
      await prisma.searchDocument.deleteMany({ where: { docType: "TEACHER", docId: teacherId } });
      return;
    }

    const reviewCount = await prisma.teacherReview.count({
      where: { teacherId, status: "VISIBLE" },
    });

    const searchableText = teacher
      ? buildSearchableText([teacher.teacherName, teacher.department, teacher.title, ...teacher.researchAreas])
      : buildSearchableText([teacherName, "教师"]);

    await prisma.searchDocument.upsert({
      where: { docType_docId: { docType: "TEACHER", docId: teacherId } },
      create: {
        docType: "TEACHER",
        docId: teacherId,
        title: teacherName,
        subtitle: teacher?.department ?? "院系待完善",
        department: teacher?.department ?? "",
        scoreSnapshot: teacher?.recentOverallScore ?? 0,
        reviewCountSnapshot: reviewCount,
        snippet: teacher?.description ?? "教师档案待补全",
        searchableText,
      },
      update: {
        title: teacherName,
        subtitle: teacher?.department ?? "院系待完善",
        department: teacher?.department ?? "",
        scoreSnapshot: teacher?.recentOverallScore ?? 0,
        reviewCountSnapshot: reviewCount,
        snippet: teacher?.description ?? "教师档案待补全",
        searchableText,
      },
    });
  } catch {
    // Best-effort sync
  }
}

export async function syncScoreSnapshots(courseId: string): Promise<void> {
  try {
    const score = await prisma.courseScoreHistory.findFirst({
      where: { courseId, granularity: "SEMESTER", overallScore: { not: null } },
      orderBy: { sortOrder: "desc" },
      select: { overallScore: true },
    });
    const reviewCount = await prisma.courseReview.count({
      where: { courseId, status: "VISIBLE" },
    });

    await prisma.searchDocument.updateMany({
      where: { docType: "COURSE", docId: courseId },
      data: {
        scoreSnapshot: score?.overallScore ?? 0,
        reviewCountSnapshot: reviewCount,
      },
    });
  } catch {
    // Best-effort
  }
}
