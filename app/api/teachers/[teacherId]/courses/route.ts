import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    teacherId: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { teacherId } = await context.params;

  const [courseRows, reviewRows] = await Promise.all([
    prisma.teacherCourse.findMany({
      where: {
        teacherId,
        isActive: true,
      },
      select: {
        courseId: true,
        courseName: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.teacherReview.findMany({
      where: {
        teacherId,
        status: {
          not: "DELETED",
        },
        sourceCourseId: {
          not: null,
        },
      },
      select: {
        sourceCourseId: true,
        overallScore: true,
      },
    }),
  ]);

  const reviewCountMap = new Map<string, number>();
  const reviewScoreMap = new Map<string, { sum: number; count: number }>();
  for (const row of reviewRows) {
    const courseId = row.sourceCourseId?.trim();
    if (!courseId) {
      continue;
    }

    reviewCountMap.set(courseId, (reviewCountMap.get(courseId) ?? 0) + 1);

    if (typeof row.overallScore === "number") {
      const current = reviewScoreMap.get(courseId) ?? { sum: 0, count: 0 };
      reviewScoreMap.set(courseId, {
        sum: current.sum + row.overallScore,
        count: current.count + 1,
      });
    }
  }

  if (courseRows.length > 0) {
    const items = courseRows.map((row) => ({
      courseId: row.courseId,
      courseName: row.courseName,
      score:
        (reviewScoreMap.get(row.courseId)?.count ?? 0) > 0
          ? Number(
              ((reviewScoreMap.get(row.courseId)?.sum ?? 0) / (reviewScoreMap.get(row.courseId)?.count ?? 1)).toFixed(
                1,
              ),
            )
          : null,
      reviewCount: reviewCountMap.get(row.courseId) ?? 0,
    }));

    return NextResponse.json({ items });
  }

  // Backward-compatible fallback for environments where the relation table is not seeded yet.
  const rows = await prisma.teacherReview.findMany({
    where: {
      teacherId,
      status: {
        not: "DELETED",
      },
      sourceCourseId: {
        not: null,
      },
    },
    select: {
      sourceCourseId: true,
      sourceCourseName: true,
      overallScore: true,
    },
  });

  const map = new Map<string, { courseId: string; courseName: string; reviewCount: number; score: number | null }>();
  for (const row of rows) {
    const courseId = row.sourceCourseId?.trim();
    if (!courseId) {
      continue;
    }

    const courseName = row.sourceCourseName?.trim() || `课程 ${courseId}`;
    const existing = map.get(courseId);
    if (existing) {
      existing.reviewCount += 1;
      if (typeof row.overallScore === "number") {
        const sum = (existing.score ?? 0) * (existing.reviewCount - 1) + row.overallScore;
        existing.score = Number((sum / existing.reviewCount).toFixed(1));
      }
      continue;
    }

    map.set(courseId, {
      courseId,
      courseName,
      reviewCount: 1,
      score: typeof row.overallScore === "number" ? Number(row.overallScore.toFixed(1)) : null,
    });
  }

  const items = Array.from(map.values()).sort((left, right) => right.reviewCount - left.reviewCount);

  return NextResponse.json({
    items,
  });
}
