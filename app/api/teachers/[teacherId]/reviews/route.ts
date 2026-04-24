import { NextRequest, NextResponse } from "next/server";
import { getTeacherReviewsPage } from "../../../../teacher/[teacherId]/_data/get-teacher-detail";
import { getSessionUserId } from "@/lib/auth/session";

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
  const currentUserId = getSessionUserId(request.headers);

  const result = await getTeacherReviewsPage(
    teacherId,
    cursor,
    Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    currentUserId,
  );

  return NextResponse.json(result);
}
