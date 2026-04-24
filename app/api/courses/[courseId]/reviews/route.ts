import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCourseReviewsPage } from "../../../../course/[courseId]/_data/get-course-detail";
import { getSessionUserId } from "@/lib/auth/session";

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

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
  const currentUserId = getSessionUserId(request.headers);

  const result = await getCourseReviewsPage(
    courseId,
    cursor,
    Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    currentUserId,
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? payload : {};
  const summary = normalizeString((body as { summary?: unknown }).summary, "");
  const nickname = normalizeString((body as { nickname?: unknown }).nickname, "匿名同学");
  const avatarUrl = normalizeString((body as { avatarUrl?: unknown }).avatarUrl, "") || null;
  const overallScoreValue = (body as { overallScore?: unknown }).overallScore;
  const overallScore =
    typeof overallScoreValue === "number" && Number.isFinite(overallScoreValue) ? overallScoreValue : null;
  const detailedScoresValue = (body as { detailedScores?: unknown }).detailedScores;
  const detailedScores = Array.isArray(detailedScoresValue) ? detailedScoresValue : null;
  const detailedScoresJson = detailedScores ?? undefined;

  const sessionUserId = getSessionUserId(request.headers);
  if (!sessionUserId) {
    return NextResponse.json({ message: "请先登录后再提交评价" }, { status: 401 });
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId,
      userId: sessionUserId,
      nickname,
      avatarUrl,
      overallScore,
      summary,
      ...(detailedScoresJson ? { detailedScoresJson } : {}),
    },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true,
      overallScore: true,
      likesCount: true,
      summary: true,
      detailedScoresJson: true,
    },
  });

  return NextResponse.json({
    id: review.id,
    nickname: review.nickname,
    avatarUrl: review.avatarUrl ?? undefined,
    createdAt: review.createdAt.toISOString(),
    overallScore: review.overallScore,
    likesCount: review.likesCount,
    liked: false,
    summary: review.summary,
    detailedScores: detailedScores ?? undefined,
  });
}
