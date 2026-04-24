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

export async function GET(_: NextRequest, context: RouteContext) {
  const { courseId } = await context.params;

  const row = await prisma.courseProfile.findUnique({
    where: {
      courseId,
    },
    select: {
      courseId: true,
      courseName: true,
      teacherName: true,
      intro: true,
      location: true,
      schedule: true,
      updatedAt: true,
    },
  });

  if (!row) {
    return NextResponse.json({ message: "课程基础信息不存在" }, { status: 404 });
  }

  return NextResponse.json({
    courseId: row.courseId,
    courseName: row.courseName,
    teacherName: row.teacherName,
    intro: row.intro,
    location: row.location,
    schedule: row.schedule,
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再更新课程信息" }, { status: 401 });
  }

  const { courseId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const courseName = normalizeText(body.courseName);
  const teacherName = normalizeText(body.teacherName);
  const intro = normalizeText(body.intro);
  const location = normalizeText(body.location);
  const schedule = normalizeText(body.schedule);

  if (!courseName || !teacherName || !intro || !location || !schedule) {
    return NextResponse.json({ message: "课程名称、教师、简介、地点、时间均为必填" }, { status: 400 });
  }

  const updated = await prisma.courseProfile.upsert({
    where: {
      courseId,
    },
    update: {
      courseName,
      teacherName,
      intro,
      location,
      schedule,
    },
    create: {
      courseId,
      courseName,
      teacherName,
      intro,
      location,
      schedule,
    },
    select: {
      courseId: true,
      courseName: true,
      teacherName: true,
      intro: true,
      location: true,
      schedule: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    courseId: updated.courseId,
    courseName: updated.courseName,
    teacherName: updated.teacherName,
    intro: updated.intro,
    location: updated.location,
    schedule: updated.schedule,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
