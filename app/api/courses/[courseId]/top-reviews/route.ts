import { NextResponse } from "next/server";
import { getCourseTopReviews } from "../../../../course/[courseId]/_data/get-course-detail";

interface RouteContext {
  params: Promise<{
    courseId: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { courseId } = await context.params;
  const result = await getCourseTopReviews(courseId);
  return NextResponse.json(result);
}
