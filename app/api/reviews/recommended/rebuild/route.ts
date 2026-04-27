import { NextRequest, NextResponse } from "next/server";

import { rebuildRecommendedReviews } from "@/lib/recommendations/rebuild-recommended-reviews";

export async function POST(request: NextRequest) {
  const token = process.env.RECOMMENDATION_REBUILD_TOKEN;

  if (token) {
    const providedToken = request.headers.get("x-recommendation-rebuild-token");

    if (providedToken !== token) {
      return NextResponse.json({ message: "无权执行推荐重建" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "未配置推荐重建令牌" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { limit?: number } | null;
  const rawLimit = payload?.limit;
  const limit =
    typeof rawLimit === "number" && Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(20, Math.floor(rawLimit)))
      : undefined;

  const reviews = await rebuildRecommendedReviews(limit);

  return NextResponse.json({
    trigger: "manual",
    limit: limit ?? null,
    count: reviews.length,
    reviewIds: reviews.map((review) => review.reviewId),
  });
}
