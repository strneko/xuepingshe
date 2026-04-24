import { NextResponse } from "next/server";
import { getCourseTopReviews } from "../../../../course/[courseId]/_data/get-course-detail";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    courseId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { courseId } = await context.params;
  const result = await getCourseTopReviews(courseId, getSessionUserId(request.headers));
  return NextResponse.json(result);
}
