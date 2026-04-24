import { NextResponse } from "next/server";
import { getTeacherTopReviews } from "../../../../teacher/[teacherId]/_data/get-teacher-detail";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    teacherId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { teacherId } = await context.params;
  const result = await getTeacherTopReviews(teacherId, getSessionUserId(request.headers));
  return NextResponse.json(result);
}
