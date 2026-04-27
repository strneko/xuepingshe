import { NextRequest, NextResponse } from "next/server";

import { rebuildRecommendedReviews } from "@/lib/recommendations/rebuild-recommended-reviews";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? process.env.RECOMMENDATION_REBUILD_TOKEN;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: "无权执行定时重建" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "未配置定时任务令牌" }, { status: 403 });
  }

  const reviews = await rebuildRecommendedReviews();

  return NextResponse.json({
    trigger: "cron",
    count: reviews.length,
    reviewIds: reviews.map((review) => review.reviewId),
  });
}
