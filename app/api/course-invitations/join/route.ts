import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再加入课程" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ message: "只有学生可以通过邀请码加入课程" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const code = normalizeCode(body.code);

  if (!code) {
    return NextResponse.json({ message: "请输入邀请码" }, { status: 400 });
  }

  const inviteCode = await prisma.courseInviteCode.findUnique({
    where: { code },
  });

  if (!inviteCode || !inviteCode.isActive) {
    return NextResponse.json({ message: "邀请码不存在或已失效" }, { status: 404 });
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { id: inviteCode.offeringId },
    select: {
      id: true,
      courseId: true,
      courseName: true,
      teacherName: true,
      semesterKey: true,
      status: true,
    },
  });

  if (!offering) {
    return NextResponse.json({ message: "课程开课实例不存在" }, { status: 404 });
  }

  if (offering.status !== "OPEN") {
    return NextResponse.json({ message: "当前课程已结课，无法加入" }, { status: 400 });
  }

  const courseProfile = await prisma.courseProfile.findUnique({
    where: { courseId: offering.courseId },
    select: {
      schedule: true,
      location: true,
    },
  });

  const existed = await prisma.enrollment.findUnique({
    where: {
      userId_offeringId: {
        userId,
        offeringId: offering.id,
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

  if (existed) {
    await prisma.enrollment.update({
      where: { id: existed.id },
      data: {
        courseId: offering.courseId,
        courseName: offering.courseName,
        teacherName: offering.teacherName,
        term: offering.semesterKey,
        classTime: courseProfile?.schedule ?? null,
        location: courseProfile?.location ?? null,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  } else {
    await prisma.enrollment.create({
      data: {
        userId,
        offeringId: offering.id,
        courseId: offering.courseId,
        courseName: offering.courseName,
        teacherName: offering.teacherName,
        term: offering.semesterKey,
        classTime: courseProfile?.schedule ?? null,
        location: courseProfile?.location ?? null,
        status: "ACTIVE",
      },
    });
  }

  return NextResponse.json({ message: "加入课程成功" });
}
