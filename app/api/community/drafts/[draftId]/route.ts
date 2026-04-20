import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUserId } from "@/lib/community/shared";

interface RouteContext {
  params: Promise<{ draftId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { draftId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    const draft = await prisma.communityDraft.findFirst({
      where: {
        id: draftId,
        authorId: userId,
      },
      select: {
        id: true,
        title: true,
        contentHtml: true,
        contentJson: true,
        topicNames: true,
        updatedAt: true,
      },
    });

    if (!draft) {
      return NextResponse.json({ message: "草稿不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: draft.id,
      title: draft.title,
      contentHtml: draft.contentHtml,
      contentJson: draft.contentJson,
      topicNames: draft.topicNames,
      updatedAt: draft.updatedAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取草稿失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { draftId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : undefined;
    const contentJson = body.contentJson;
    const topicNames = Array.isArray(body.topicNames)
      ? (body.topicNames
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12) as string[])
      : undefined;

    const updated = await prisma.communityDraft.updateMany({
      where: {
        id: draftId,
        authorId: userId,
      },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(contentHtml !== undefined ? { contentHtml } : {}),
        ...(contentJson !== undefined ? { contentJson } : {}),
        ...(topicNames !== undefined ? { topicNames } : {}),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ message: "草稿不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "草稿已更新" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新草稿失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { draftId } = await context.params;
    const userId = await resolveCurrentUserId(request);

    const deleted = await prisma.communityDraft.deleteMany({
      where: {
        id: draftId,
        authorId: userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ message: "草稿不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "草稿已删除" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除草稿失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
