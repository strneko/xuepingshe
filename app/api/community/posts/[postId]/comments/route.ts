import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHotScore, parseLimit, parseOffsetCursor, resolveCurrentUserId } from "@/lib/community/shared";
import { enqueueCommunityPostCommentNotification } from "@/lib/community/notifications";

interface RouteContext {
  params: Promise<{ postId: string }>;
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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const offset = parseOffsetCursor(request.nextUrl.searchParams.get("offset"));
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), { defaultValue: 20, maxValue: 50 });

    const [post, comments, total] = await prisma.$transaction([
      prisma.communityPost.findFirst({
        where: { id: postId, status: "PUBLISHED" },
        select: { id: true },
      }),
      prisma.communityPostComment.findMany({
        where: { postId, status: "VISIBLE" },
        orderBy: { createdAt: "asc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          content: true,
          authorId: true,
          replyToCommentId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
        },
      }),
      prisma.communityPostComment.count({
        where: { postId, status: "VISIBLE" },
      }),
    ]);

    if (!post) {
      return NextResponse.json({ message: "帖子不存在" }, { status: 404 });
    }

    const nextOffset = offset + comments.length;
    return NextResponse.json({
      items: comments.map(toCommentResponse),
      hasMore: nextOffset < total,
      nextOffset,
      total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取评论失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const userId = await resolveCurrentUserId(request);

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
        where: { id: postId, status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          authorId: true,
          author: { select: { name: true } },
          likeCount: true,
          commentCount: true,
          createdAt: true,
        },
      });

      if (!post) {
        throw new Error("帖子不存在");
      }

      const actor = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const replyToComment = replyToCommentId
        ? await tx.communityPostComment.findFirst({
            where: { id: replyToCommentId, postId, status: "VISIBLE" },
            select: { id: true, authorId: true },
          })
        : null;

      if (replyToCommentId && !replyToComment) {
        throw new Error("回复评论不存在");
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
          authorId: true,
          replyToCommentId: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { name: true } },
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
        comment,
        commentCount: nextCommentCount,
        notification: {
          postId: post.id,
          postTitle: post.title,
          postAuthorId: post.authorId,
          actorId: userId,
          actorNickname: actor?.name ?? "匿名同学",
          commentId: comment.id,
          replyToAuthorId: replyToComment?.authorId ?? null,
        },
      };
    });

    void enqueueCommunityPostCommentNotification(result.notification).catch((error) => {
      console.error("Failed to enqueue community comment notification", error);
    });

    return NextResponse.json({
      comment: toCommentResponse(result.comment),
      commentCount: result.commentCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "评论失败";
    const status = message === "帖子不存在" ? 404 : message === "回复评论不存在" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
