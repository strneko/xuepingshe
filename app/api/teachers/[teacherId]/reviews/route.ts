import { NextRequest, NextResponse } from "next/server";
import { getTeacherReviewsPage } from "../../../../teacher/[teacherId]/_data/get-teacher-detail";

interface RouteContext {
  params: Promise<{
    teacherId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { teacherId } = await context.params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;

  const result = await getTeacherReviewsPage(teacherId, cursor, Number.isFinite(parsedLimit) ? parsedLimit : undefined);

  return NextResponse.json(result);
}
