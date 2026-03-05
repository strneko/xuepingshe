import { NextRequest, NextResponse } from "next/server";
import { getCourseReviewsPage } from "../../../../course/[courseId]/_data/get-course-detail";

interface RouteContext {
  params: Promise<{
    courseId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;

  const result = await getCourseReviewsPage(courseId, cursor, Number.isFinite(parsedLimit) ? parsedLimit : undefined);

  return NextResponse.json(result);
}
