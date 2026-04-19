import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHotScore, resolveCurrentUserId } from "@/lib/community/shared";

interface RouteContext {
  params: Promise<{ postId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.findFirst({
        where: {
          id: postId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
        },
      });

      if (!post) {
        throw new Error("帖子不存在");
      }

      const existing = await tx.communityPostLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
        select: { id: true },
      });

      const liked = !existing;
      const nextLikeCount = liked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);

      if (liked) {
        await tx.communityPostLike.create({
          data: {
            postId,
            userId,
          },
        });
      } else {
        await tx.communityPostLike.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });
      }

      await tx.communityPost.update({
        where: { id: postId },
        data: {
          likeCount: nextLikeCount,
          hotScore: computeHotScore(nextLikeCount, post.commentCount, post.createdAt),
        },
      });

      return {
        liked,
        likeCount: nextLikeCount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "点赞操作失败";
    const status = message === "帖子不存在" ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
