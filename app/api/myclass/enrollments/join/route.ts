import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

function parseTeacherFromSubtitle(subtitle: string) {
  const cleaned = subtitle.trim();
  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("任课教师：")) {
    const teacherName = cleaned.slice("任课教师：".length).trim();
    return teacherName || null;
  }

  return cleaned;
}

export async function POST(request: Request) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再加入课程" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const inviteCode =
    payload && typeof payload === "object" && typeof (payload as { inviteCode?: unknown }).inviteCode === "string"
      ? (payload as { inviteCode: string }).inviteCode.trim().toUpperCase()
      : "";

  if (!inviteCode) {
    return NextResponse.json({ message: "邀请码不能为空" }, { status: 400 });
  }

  const invite = await prisma.courseInviteCode.findFirst({
    where: {
      code: inviteCode,
      isActive: true,
    },
    select: {
      courseId: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ message: "邀请码无效或已失效" }, { status: 404 });
  }

  const courseDoc = await prisma.searchDocument.findFirst({
    where: {
      docType: "COURSE",
      docId: invite.courseId,
    },
    select: {
      docId: true,
      title: true,
      subtitle: true,
      department: true,
    },
  });

  if (!courseDoc) {
    return NextResponse.json({ message: "课程不存在或未开放" }, { status: 404 });
  }

  const existed = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: courseDoc.docId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existed?.status === "ACTIVE") {
    return NextResponse.json({ message: "你已加入该课程" }, { status: 409 });
  }

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId: courseDoc.docId,
      },
    },
    update: {
      courseName: courseDoc.title,
      teacherName: parseTeacherFromSubtitle(courseDoc.subtitle),
      location: courseDoc.department,
      classTime: "待教务系统同步",
      status: "ACTIVE",
      enrolledAt: new Date(),
    },
    create: {
      userId,
      courseId: courseDoc.docId,
      courseName: courseDoc.title,
      teacherName: parseTeacherFromSubtitle(courseDoc.subtitle),
      location: courseDoc.department,
      classTime: "待教务系统同步",
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ message: "加入课程成功" });
}
