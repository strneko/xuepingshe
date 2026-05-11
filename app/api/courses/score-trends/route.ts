import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const courseIdsParam = request.nextUrl.searchParams.get("courseIds");
  if (!courseIdsParam) {
    return NextResponse.json({ trends: {} });
  }

  const courseIds = courseIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
  if (courseIds.length === 0) {
    return NextResponse.json({ trends: {} });
  }

  // Limit to 20 courses to prevent abuse
  const limitedIds = courseIds.slice(0, 20);

  const rows = await prisma.courseScoreHistory.findMany({
    where: {
      courseId: { in: limitedIds },
      granularity: "SEMESTER",
    },
    orderBy: [{ courseId: "asc" }, { sortOrder: "asc" }],
    select: {
      courseId: true,
      timeLabel: true,
      overallScore: true,
    },
    take: 300, // 20 courses * 15 entries each max
  });

  const trends: Record<string, { timeLabel: string; overallScore: number | null }[]> = {};

  for (const row of rows) {
    if (!trends[row.courseId]) {
      trends[row.courseId] = [];
    }
    trends[row.courseId]!.push({
      timeLabel: row.timeLabel,
      overallScore: row.overallScore,
    });
  }

  return NextResponse.json({ trends });
}
