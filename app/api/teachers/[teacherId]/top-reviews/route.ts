import { NextResponse } from "next/server";
import { getTeacherTopReviews } from "../../../../teacher/[teacherId]/_data/get-teacher-detail";

interface RouteContext {
  params: Promise<{
    teacherId: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { teacherId } = await context.params;
  const result = await getTeacherTopReviews(teacherId);
  return NextResponse.json(result);
}
