import { NextRequest, NextResponse } from "next/server";

import { CommunityPost } from "@/app/community/_types";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUserId, stripHtml } from "@/lib/community/shared";

interface RouteContext {
  params: Promise<{ postId: string }>;
}

function normalizeTopicNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const cleaned = item.trim();
    if (!cleaned) {
      continue;
    }

    unique.add(cleaned);
  }

  return Array.from(unique).slice(0, 8);
}

function toCommunityPost(post: {
  id: string;
  authorId: string;
  title: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  lastReplyAt: Date | null;
  likeCount: number;
  commentCount: number;
  hotScore: number;
  author: { name: string | null };
  topics: Array<{ topic: { name: string } }>;
}): CommunityPost {
  return {
    id: post.id,
    title: post.title,
    authorId: post.authorId,
    contentHtml: post.contentHtml,
    author: {
      nickname: post.author.name ?? "匿名同学",
      avatarUrl: "",
    },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString(),
    content: stripHtml(post.contentHtml),
    images: [],
    tags: post.topics.map((item) => item.topic.name),
    likesCount: post.likeCount,
    isLiked: false,
    commentsCount: post.commentCount,
    hotScore: post.hotScore,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";
    const topicNames = normalizeTopicNames(body.topicNames ?? body.topics);

    if (!title) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }

    if (title.length > 30) {
      return NextResponse.json({ message: "标题不能超过 30 个字" }, { status: 400 });
    }

    if (!stripHtml(contentHtml)) {
      return NextResponse.json({ message: "正文不能为空" }, { status: 400 });
    }

    if (topicNames.length === 0) {
      return NextResponse.json({ message: "请至少选择 1 个话题" }, { status: 400 });
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.findFirst({
        where: {
          id: postId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          authorId: true,
          title: true,
          contentHtml: true,
          createdAt: true,
          updatedAt: true,
          lastReplyAt: true,
          likeCount: true,
          commentCount: true,
          hotScore: true,
          author: {
            select: {
              name: true,
            },
          },
          topics: {
            select: {
              topicId: true,
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        throw new Error("帖子不存在");
      }

      if (post.authorId !== userId) {
        throw new Error("无权编辑该帖子");
      }

      const previousTopicIds = post.topics.map((item) => item.topicId);
      const nextTopics: Array<{ id: string; name: string }> = [];

      for (const topicName of topicNames) {
        const topic = await tx.communityTopic.upsert({
          where: { name: topicName },
          update: {},
          create: { name: topicName },
          select: { id: true, name: true },
        });

        nextTopics.push(topic);
      }

      const nextTopicIds = nextTopics.map((item) => item.id);
      const removedTopicIds = previousTopicIds.filter((topicId) => !nextTopicIds.includes(topicId));
      const addedTopicIds = nextTopicIds.filter((topicId) => !previousTopicIds.includes(topicId));

      await tx.communityPost.update({
        where: { id: post.id },
        data: {
          title,
          contentHtml,
        },
      });

      if (removedTopicIds.length > 0) {
        await tx.communityTopic.updateMany({
          where: {
            id: {
              in: removedTopicIds,
            },
          },
          data: {
            postCount: {
              decrement: 1,
            },
          },
        });
      }

      if (addedTopicIds.length > 0) {
        await tx.communityTopic.updateMany({
          where: {
            id: {
              in: addedTopicIds,
            },
          },
          data: {
            postCount: {
              increment: 1,
            },
          },
        });
      }

      await tx.communityPostTopic.deleteMany({
        where: {
          postId: post.id,
        },
      });

      if (nextTopics.length > 0) {
        await tx.communityPostTopic.createMany({
          data: nextTopics.map((topic) => ({
            postId: post.id,
            topicId: topic.id,
          })),
        });
      }

      return tx.communityPost.findFirst({
        where: {
          id: post.id,
        },
        select: {
          id: true,
          authorId: true,
          title: true,
          contentHtml: true,
          createdAt: true,
          updatedAt: true,
          lastReplyAt: true,
          likeCount: true,
          commentCount: true,
          hotScore: true,
          author: {
            select: {
              name: true,
            },
          },
          topics: {
            select: {
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    if (!updatedPost) {
      return NextResponse.json({ message: "帖子不存在" }, { status: 404 });
    }

    return NextResponse.json({
      post: toCommunityPost(updatedPost),
      message: "帖子已更新",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新帖子失败";
    const status = message === "帖子不存在" ? 404 : message === "无权编辑该帖子" ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    await prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.findFirst({
        where: {
          id: postId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          authorId: true,
          topics: {
            select: {
              topicId: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error("帖子不存在");
      }

      if (post.authorId !== userId) {
        throw new Error("无权删除该帖子");
      }

      await tx.communityPost.update({
        where: { id: post.id },
        data: {
          status: "DELETED",
        },
      });

      if (post.topics.length > 0) {
        await tx.communityTopic.updateMany({
          where: {
            id: {
              in: post.topics.map((item) => item.topicId),
            },
          },
          data: {
            postCount: {
              decrement: 1,
            },
          },
        });
      }
    });

    return NextResponse.json({ message: "帖子已删除" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除帖子失败";
    const status = message === "帖子不存在" ? 404 : message === "无权删除该帖子" ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
