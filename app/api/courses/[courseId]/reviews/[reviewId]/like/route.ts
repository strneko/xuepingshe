import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { enqueueCourseReviewLikeNotification } from "@/lib/course/notifications";

interface RouteContext {
  params: Promise<{
    courseId: string;
    reviewId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { courseId, reviewId } = await context.params;
  const userId = getSessionUserId(request.headers);

  if (!userId) {
    return NextResponse.json({ message: "请先登录后再点赞" }, { status: 401 });
  }

  const review = await prisma.courseReview.findFirst({
    where: {
      id: reviewId,
      courseId,
    },
    select: {
      id: true,
      likesCount: true,
      userId: true,
    },
  });

  if (!review) {
    return NextResponse.json({ message: "评价不存在" }, { status: 404 });
  }

  const existingLike = await prisma.courseReviewLike.findUnique({
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
      await tx.courseReviewLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      return tx.courseReview.update({
        where: {
          id: reviewId,
        },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
        select: {
          id: true,
          likesCount: true,
        },
      });
    }

    await tx.courseReviewLike.create({
      data: {
        reviewId,
        userId,
      },
    });

    return tx.courseReview.update({
      where: {
        id: reviewId,
      },
      data: {
        likesCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        likesCount: true,
      },
    });
  });

  const liked = !existingLike;

  if (liked && review.userId !== userId) {
    const [currentUser, courseOffering] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.courseOffering.findFirst({
        where: { courseId },
        select: { courseName: true },
      }),
    ]);

    void enqueueCourseReviewLikeNotification({
      courseId,
      courseName: courseOffering?.courseName ?? `课程 ${courseId}`,
      reviewId,
      reviewAuthorId: review.userId,
      actorId: userId,
      actorNickname: currentUser?.name ?? null,
    }).catch(() => {});
  }

  return NextResponse.json({
    reviewId: result.id,
    likesCount: result.likesCount,
    liked,
  });
}
