import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    reviewId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { reviewId } = await context.params;
  const userId = getSessionUserId(request.headers);

  if (!userId) {
    return NextResponse.json({ message: "请先登录后再点赞" }, { status: 401 });
  }

  const recommended = await prisma.recommendedReview.findFirst({
    where: {
      reviewId,
      isActive: true,
    },
    select: {
      reviewId: true,
      sourceCourseId: true,
      sourceTeacherId: true,
    },
  });

  if (!recommended) {
    return NextResponse.json({ message: "推荐评价不存在" }, { status: 404 });
  }

  const existingLike = await prisma.recommendedReviewLike.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (existingLike) {
      await tx.recommendedReviewLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      const updatedReview = await tx.recommendedReview.update({
        where: {
          reviewId,
        },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      await tx.recommendedReview.updateMany({
        where: {
          reviewId,
        },
        data: {
          likesCount: updatedReview.likesCount,
        },
      });

      return {
        likesCount: updatedReview.likesCount,
        liked: false,
      };
    }

    await tx.recommendedReviewLike.create({
      data: {
        reviewId,
        userId,
      },
    });

    const updatedReview = await tx.recommendedReview.update({
      where: {
        reviewId,
      },
      data: {
        likesCount: {
          increment: 1,
        },
      },
      select: {
        likesCount: true,
      },
    });

    await tx.recommendedReview.updateMany({
      where: {
        reviewId,
      },
      data: {
        likesCount: updatedReview.likesCount,
      },
    });

    return {
      likesCount: updatedReview.likesCount,
      liked: true,
    };
  });

  return NextResponse.json({
    reviewId,
    likesCount: result.likesCount,
    liked: result.liked,
  });
}
