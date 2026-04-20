import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHotScore, resolveCurrentUserId } from "@/lib/community/shared";
import { enqueueCommunityPostLikeNotification } from "@/lib/community/notifications";

interface RouteContext {
  params: Promise<{ postId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const desiredLiked = typeof body.liked === "boolean" ? body.liked : null;

    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.findFirst({
        where: {
          id: postId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          authorId: true,
          author: {
            select: {
              name: true,
            },
          },
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

      const liked = desiredLiked ?? !existing;

      if (desiredLiked !== null) {
        if (desiredLiked === Boolean(existing)) {
          return {
            liked: desiredLiked,
            likeCount: post.likeCount,
            notification: null,
          };
        }

        if (desiredLiked) {
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

        const nextLikeCount = desiredLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);

        await tx.communityPost.update({
          where: { id: postId },
          data: {
            likeCount: nextLikeCount,
            hotScore: computeHotScore(nextLikeCount, post.commentCount, post.createdAt),
          },
        });

        return {
          liked: desiredLiked,
          likeCount: nextLikeCount,
          notification: desiredLiked
            ? {
                postId: post.id,
                postTitle: post.title,
                postAuthorId: post.authorId,
                actorId: userId,
                actorNickname:
                  (
                    await tx.user.findUnique({
                      where: { id: userId },
                      select: { name: true },
                    })
                  )?.name ?? "匿名同学",
              }
            : null,
        };
      }

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
        notification: liked
          ? {
              postId: post.id,
              postTitle: post.title,
              postAuthorId: post.authorId,
              actorId: userId,
              actorNickname:
                (
                  await tx.user.findUnique({
                    where: { id: userId },
                    select: { name: true },
                  })
                )?.name ?? "匿名同学",
            }
          : null,
      };
    });

    if (result.notification) {
      void enqueueCommunityPostLikeNotification(result.notification).catch((error) => {
        console.error("Failed to enqueue community like notification", error);
      });
    }

    return NextResponse.json({
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "点赞操作失败";
    const status = message === "帖子不存在" ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
