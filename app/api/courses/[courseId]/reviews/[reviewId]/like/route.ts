import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "demo-user";

interface RouteContext {
  params: Promise<{
    courseId: string;
    reviewId: string;
  }>;
}

async function ensureDemoUser() {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
    create: {
      id: DEMO_USER_ID,
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
  });
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const { courseId, reviewId } = await context.params;

  await ensureDemoUser();

  const review = await prisma.courseReview.findFirst({
    where: {
      id: reviewId,
      courseId,
    },
    select: {
      id: true,
      likesCount: true,
    },
  });

  if (!review) {
    return NextResponse.json({ message: "评价不存在" }, { status: 404 });
  }

  const existingLike = await prisma.courseReviewLike.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId: DEMO_USER_ID,
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
        userId: DEMO_USER_ID,
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

  return NextResponse.json({
    reviewId: result.id,
    likesCount: result.likesCount,
    liked: !existingLike,
  });
}
