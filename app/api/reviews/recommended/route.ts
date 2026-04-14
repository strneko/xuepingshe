import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toRecommendedReviewItem } from "@/lib/search-recommendation";

export async function GET() {
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

  return NextResponse.json(reviews.map((review) => toRecommendedReviewItem(review)));
}
