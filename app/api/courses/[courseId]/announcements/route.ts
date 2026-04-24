import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    courseId: string;
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

function parsePublishAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;
  const includeOffline = request.nextUrl.searchParams.get("includeOffline") === "1";

  const rows = await prisma.courseAnnouncement.findMany({
    where: {
      courseId,
      ...(includeOffline ? {} : { status: "PUBLISHED" }),
    },
    orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      publishAt: row.publishAt.toISOString(),
      publishAtLabel: formatDate(row.publishAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再发布公告" }, { status: 401 });
  }

  const { courseId } = await context.params;

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
  const publishAt = parsePublishAt(body.publishAt);

  if (!title) {
    return NextResponse.json({ message: "公告标题不能为空" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ message: "公告内容不能为空" }, { status: 400 });
  }

  if (!publishAt) {
    return NextResponse.json({ message: "发布时间格式无效" }, { status: 400 });
  }

  const created = await prisma.courseAnnouncement.create({
    data: {
      courseId,
      authorId: userId,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    id: created.id,
    title: created.title,
    content: created.content,
    status: created.status,
    publishAt: created.publishAt.toISOString(),
    publishAtLabel: formatDate(created.publishAt),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}
