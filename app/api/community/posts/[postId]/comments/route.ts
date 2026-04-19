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

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const replyToCommentId = typeof body.replyToCommentId === "string" ? body.replyToCommentId.trim() : null;

    if (!content) {
      return NextResponse.json({ message: "评论内容不能为空" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ message: "评论内容不能超过 500 字" }, { status: 400 });
    }

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

      const comment = await tx.communityPostComment.create({
        data: {
          postId,
          authorId: userId,
          content,
          ...(replyToCommentId ? { replyToCommentId } : {}),
        },
        select: {
          id: true,
          content: true,
          replyToCommentId: true,
          createdAt: true,
        },
      });

      const nextCommentCount = post.commentCount + 1;

      await tx.communityPost.update({
        where: { id: postId },
        data: {
          commentCount: nextCommentCount,
          lastReplyAt: new Date(),
          hotScore: computeHotScore(post.likeCount, nextCommentCount, post.createdAt),
        },
      });

      return {
        comment: {
          id: comment.id,
          content: comment.content,
          replyToCommentId: comment.replyToCommentId,
          createdAt: comment.createdAt.toISOString(),
        },
        commentCount: nextCommentCount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "评论失败";
    const status = message === "帖子不存在" ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
