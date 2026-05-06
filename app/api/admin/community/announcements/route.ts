import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { enqueueCommunityAnnouncementPublishedNotification } from "@/lib/community/notifications";

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

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const href = typeof body.href === "string" ? body.href.trim() : null;
  const pinned = typeof body.pinned === "boolean" ? body.pinned : true;

  if (!title) {
    return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
  }

  const maxOrder = await prisma.communityAnnouncement.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const announcement = await prisma.communityAnnouncement.create({
    data: {
      title,
      href,
      pinned,
      sortOrder,
    },
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

  void enqueueCommunityAnnouncementPublishedNotification({
    announcementId: announcement.id,
    announcementTitle: announcement.title,
    actorId: auth.userId,
  }).catch((error) => {
    console.error("Failed to enqueue community announcement notification", error);
  });

  return NextResponse.json(announcement);
}
