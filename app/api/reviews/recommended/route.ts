import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toRecommendedReviewItem } from "@/lib/search-recommendation";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request.headers);

  const reviews = await prisma.recommendedReview.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ rankScore: "desc" }, { createdAt: "desc" }],
    select: {
      reviewId: true,
      nickname: true,
      sourceCourseId: true,
      sourceCourseName: true,
      sourceTeacherId: true,
      sourceTeacherName: true,
      createdAt: true,
      overallScore: true,
      likesCount: true,
      summary: true,
      detailedScoresJson: true,
    },
  });

  let likedReviewIdSet = new Set<string>();

  if (userId) {
    const likedRows = await prisma.recommendedReviewLike.findMany({
      where: {
        userId,
        reviewId: {
          in: reviews.map((item) => item.reviewId),
        },
      },
      select: {
        reviewId: true,
      },
    });

    likedReviewIdSet = new Set(likedRows.map((item) => item.reviewId));
  }

  return NextResponse.json(
    reviews.map((review) => ({
      ...toRecommendedReviewItem(review),
      liked: likedReviewIdSet.has(review.reviewId),
    })),
  );
}
