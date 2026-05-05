import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

interface RouteContext {
  params: Promise<{ announcementId: string }>;
}

async function requireAdmin(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return { authorized: false as const, response: NextResponse.json({ message: "请先登录" }, { status: 401 }) };
  }
  if (!isAdmin(userId)) {
    return { authorized: false as const, response: NextResponse.json({ message: "无权限" }, { status: 403 }) };
  }
  return { authorized: true as const, userId };
}

async function getAnnouncement(announcementId: string) {
  const announcement = await prisma.communityAnnouncement.findUnique({
    where: { id: announcementId },
    select: { id: true },
  });
  return announcement;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { announcementId } = await context.params;

  const existing = await getAnnouncement(announcementId);
  if (!existing) {
    return NextResponse.json({ message: "公告不存在" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }

  if (typeof body.href === "string") {
    data.href = body.href.trim() || null;
  }

  if (typeof body.pinned === "boolean") {
    data.pinned = body.pinned;
  }

  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.trunc(body.sortOrder);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "没有需要更新的字段" }, { status: 400 });
  }

  const announcement = await prisma.communityAnnouncement.update({
    where: { id: announcementId },
    data,
    select: {
      id: true,
      title: true,
      href: true,
      pinned: true,
      sortOrder: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(announcement);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const { announcementId } = await context.params;

  const existing = await getAnnouncement(announcementId);
  if (!existing) {
    return NextResponse.json({ message: "公告不存在" }, { status: 404 });
  }

  await prisma.communityAnnouncement.delete({ where: { id: announcementId } });

  return NextResponse.json({ message: "公告已删除" });
}
