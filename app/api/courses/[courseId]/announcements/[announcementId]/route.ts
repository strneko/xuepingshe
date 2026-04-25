import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { enqueueCourseAnnouncementUpdatedNotification } from "@/lib/course/notifications";

interface RouteContext {
  params: Promise<{
    courseId: string;
    announcementId: string;
  }>;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseStatus(value: unknown) {
  if (value === "OFFLINE") {
    return "OFFLINE" as const;
  }

  return "PUBLISHED" as const;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再修改公告" }, { status: 401 });
  }

  const { courseId, announcementId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const title = normalizeText(body.title);
  const content = normalizeText(body.content);
  const status = parseStatus(body.status);

  if (!title) {
    return NextResponse.json({ message: "公告标题不能为空" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ message: "公告内容不能为空" }, { status: 400 });
  }

  const existing = await prisma.courseAnnouncement.findFirst({
    where: {
      id: announcementId,
      courseId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "公告不存在" }, { status: 404 });
  }

  const publishAt = existing.content === content ? existing.publishAt : new Date();
  const hasChanged = existing.title !== title || existing.content !== content || existing.status !== status;

  const updated = await prisma.courseAnnouncement.update({
    where: {
      id: announcementId,
    },
    data: {
      title,
      content,
      status,
      publishAt,
    },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishAt: true,
      updatedAt: true,
    },
  });

  if (hasChanged && updated.status === "PUBLISHED") {
    try {
      await enqueueCourseAnnouncementUpdatedNotification({
        courseId,
        announcementId: updated.id,
        announcementTitle: updated.title,
        actorId: userId,
        updatedAtIso: updated.updatedAt.toISOString(),
      });
    } catch (notificationError) {
      void notificationError;
    }
  }

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    content: updated.content,
    status: updated.status,
    publishAt: updated.publishAt.toISOString(),
    publishAtLabel: formatDate(updated.publishAt),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再删除公告" }, { status: 401 });
  }

  const { courseId, announcementId } = await context.params;

  const existing = await prisma.courseAnnouncement.findFirst({
    where: {
      id: announcementId,
      courseId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "公告不存在" }, { status: 404 });
  }

  await prisma.courseAnnouncement.delete({
    where: {
      id: announcementId,
    },
  });

  return NextResponse.json({ success: true });
}
