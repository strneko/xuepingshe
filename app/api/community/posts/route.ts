import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommunityPostListItem } from "@/lib/community/types";
import {
  computeHotScore,
  parseLimit,
  parseOffsetCursor,
  parseSort,
  resolveCurrentUserId,
  stripHtml,
} from "@/lib/community/shared";

type SortOrderInput = "latest-post" | "latest-reply" | "hottest";

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

function toPostListItem(post: {
  id: string;
  title: string;
  contentHtml: string;
  createdAt: Date;
  lastReplyAt: Date | null;
  likeCount: number;
  commentCount: number;
  hotScore: number;
  likes?: Array<{ id: string }>;
  author: { name: string | null };
  topics: Array<{ topic: { name: string } }>;
}): CommunityPostListItem {
  return {
    id: post.id,
    title: post.title,
    author: {
      nickname: post.author.name ?? "匿名同学",
      avatarUrl: "",
    },
    createdAt: post.createdAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString(),
    content: stripHtml(post.contentHtml),
    images: [],
    tags: post.topics.map((item) => item.topic.name),
    likesCount: post.likeCount,
    isLiked: Boolean(post.likes?.length),
    commentsCount: post.commentCount,
    hotScore: post.hotScore,
  };
}

function buildOrderBy(sort: SortOrderInput) {
  if (sort === "latest-reply") {
    return [{ lastReplyAt: "desc" as const }, { createdAt: "desc" as const }];
  }

  if (sort === "hottest") {
    return [{ hotScore: "desc" as const }, { createdAt: "desc" as const }];
  }

  return [{ createdAt: "desc" as const }];
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));
    const sort = parseSort(request.nextUrl.searchParams.get("sort"));
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), { defaultValue: 8, maxValue: 30 });
    const offset = parseOffsetCursor(request.nextUrl.searchParams.get("cursor"));

    const [posts, total] = await prisma.$transaction([
      prisma.communityPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: buildOrderBy(sort),
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          contentHtml: true,
          createdAt: true,
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
          likes: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      }),
      prisma.communityPost.count({ where: { status: "PUBLISHED" } }),
    ]);

    const items = posts.map(toPostListItem);
    const nextOffset = offset + items.length;

    return NextResponse.json({
      items,
      nextCursor: nextOffset < total ? String(nextOffset) : null,
      hasMore: nextOffset < total,
      total,
      sort,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取帖子列表失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request.headers.get("x-user-id"));

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";
    const contentJson = body.contentJson ?? null;
    const topicNames = normalizeTopicNames(body.topicNames ?? body.topics);
    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";

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

    const created = await prisma.$transaction(async (tx) => {
      const topics = [] as Array<{ id: string; name: string }>;

      for (const topicName of topicNames) {
        const topic = await tx.communityTopic.upsert({
          where: { name: topicName },
          update: {},
          create: { name: topicName },
          select: { id: true, name: true },
        });
        topics.push(topic);
      }

      const now = new Date();
      const post = await tx.communityPost.create({
        data: {
          authorId: userId,
          title,
          contentHtml,
          ...(contentJson ? { contentJson } : {}),
          lastReplyAt: now,
          hotScore: computeHotScore(0, 0, now),
          topics: {
            create: topics.map((topic) => ({
              topic: {
                connect: { id: topic.id },
              },
            })),
          },
        },
        select: {
          id: true,
          title: true,
          contentHtml: true,
          createdAt: true,
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

      await Promise.all(
        topics.map((topic) =>
          tx.communityTopic.update({
            where: { id: topic.id },
            data: {
              postCount: {
                increment: 1,
              },
            },
          }),
        ),
      );

      if (draftId) {
        await tx.communityDraft.deleteMany({
          where: {
            id: draftId,
            authorId: userId,
          },
        });
      }

      return post;
    });

    return NextResponse.json({
      message: "发布成功",
      item: {
        ...toPostListItem(created),
        isLiked: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "发布帖子失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
