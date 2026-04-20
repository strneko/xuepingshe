import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLimit, resolveCurrentUserId, stripHtml } from "@/lib/community/shared";

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

  return Array.from(unique).slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
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
    const contentJson = body.contentJson ?? null;
    const topicNames = normalizeTopicNames(body.topicNames ?? body.topics);
    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";

    if (title.length > 30) {
      return NextResponse.json({ message: "标题不能超过 30 个字" }, { status: 400 });
    }

    if (!title && !contentHtml) {
      return NextResponse.json({ message: "草稿内容不能为空" }, { status: 400 });
    }

    if (draftId) {
      const updated = await prisma.communityDraft.updateMany({
        where: {
          id: draftId,
          authorId: userId,
        },
        data: {
          title,
          contentHtml,
          ...(contentJson ? { contentJson } : {}),
          topicNames,
        },
      });

      if (updated.count > 0) {
        const draft = await prisma.communityDraft.findUnique({
          where: { id: draftId },
          select: { id: true, updatedAt: true },
        });

        return NextResponse.json({
          message: "草稿已更新",
          draftId: draft?.id ?? draftId,
          updatedAt: draft?.updatedAt?.toISOString(),
        });
      }
    }

    const created = await prisma.communityDraft.create({
      data: {
        authorId: userId,
        title,
        contentHtml,
        ...(contentJson ? { contentJson } : {}),
        topicNames,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "草稿已保存",
      draftId: created.id,
      updatedAt: created.updatedAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存草稿失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"), { defaultValue: 20, maxValue: 50 });

    const drafts = await prisma.communityDraft.findMany({
      where: {
        authorId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        contentHtml: true,
        topicNames: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      items: drafts.map((draft) => ({
        id: draft.id,
        title: draft.title,
        excerpt: stripHtml(draft.contentHtml).slice(0, 120),
        topicNames: draft.topicNames,
        updatedAt: draft.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取草稿列表失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
