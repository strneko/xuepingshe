import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHotScore, resolveCurrentUserId } from "@/lib/community/shared";

interface RouteContext {
  params: Promise<{ postId: string; commentId: string }>;
}

function toCommentResponse(comment: {
  id: string;
  content: string;
  authorId: string;
  replyToCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string | null };
}) {
  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    replyToCommentId: comment.replyToCommentId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      nickname: comment.author.name ?? "匿名同学",
      avatarUrl: "",
    },
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { postId, commentId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ message: "评论内容不能为空" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ message: "评论内容不能超过 500 字" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.communityPostComment.findFirst({
        where: { id: commentId, postId, status: "VISIBLE" },
        select: { id: true, authorId: true },
      });

      if (!comment) throw new Error("评论不存在");
      if (comment.authorId !== userId) throw new Error("无权编辑该评论");

      return tx.communityPostComment.update({
        where: { id: commentId },
        data: { content },
        select: {
          id: true,
          content: true,
          authorId: true,
          replyToCommentId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
        },
      });
    });

    return NextResponse.json({ comment: toCommentResponse(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "编辑评论失败";
    const status = message === "评论不存在" ? 404 : message === "无权编辑该评论" ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { postId, commentId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    await prisma.$transaction(async (tx) => {
      const comment = await tx.communityPostComment.findFirst({
        where: { id: commentId, postId, status: "VISIBLE" },
        select: { id: true, authorId: true },
      });

      if (!comment) throw new Error("评论不存在");
      if (comment.authorId !== userId) throw new Error("无权删除该评论");

      await tx.communityPostComment.update({
        where: { id: commentId },
        data: { status: "DELETED" },
      });

      const post = await tx.communityPost.findUnique({
        where: { id: postId },
        select: { likeCount: true, commentCount: true, createdAt: true, updatedAt: true },
      });

      if (post) {
        const nextCommentCount = Math.max(0, post.commentCount - 1);
        await tx.communityPost.update({
          where: { id: postId },
          data: {
            commentCount: nextCommentCount,
            hotScore: computeHotScore(post.likeCount, nextCommentCount, post.createdAt),
            updatedAt: post.updatedAt,
          },
        });
      }
    });

    return NextResponse.json({ message: "评论已删除" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除评论失败";
    const status = message === "评论不存在" ? 404 : message === "无权删除该评论" ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}
