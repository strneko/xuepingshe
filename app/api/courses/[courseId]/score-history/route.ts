import { NextRequest, NextResponse } from "next/server";
import { getCourseScoreHistoryPage } from "../../../../course/[courseId]/_data/get-course-detail";
import { ScoreHistoryGranularity } from "../../../../course/[courseId]/_types";

interface RouteContext {
  params: Promise<{
    courseId: string;
  }>;
}

function parseGranularity(value: string | null): ScoreHistoryGranularity {
  if (value === "year" || value === "month" || value === "day") {
    return value;
  }

  return "semester";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;
  const granularity = parseGranularity(request.nextUrl.searchParams.get("granularity"));
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;

  const result = await getCourseScoreHistoryPage(
    courseId,
    granularity,
    cursor,
    Number.isFinite(parsedLimit) ? parsedLimit : undefined,
  );

  return NextResponse.json(result);
}
