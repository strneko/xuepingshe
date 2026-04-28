import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { buildInviteCode, getCurrentSemesterKey, normalizeSemesterKey } from "@/lib/course-offerings";

interface RouteContext {
  params: Promise<{
    courseId: string;
  }>;
}

function parseIsoDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(value: unknown) {
  return value === "CLOSED" ? "CLOSED" : "OPEN";
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再创建开课实例" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ message: "只有教师可以创建开课实例" }, { status: 403 });
  }

  const { courseId } = await context.params;

  const course = await prisma.courseProfile.findUnique({
    where: { courseId },
    select: {
      courseId: true,
      courseName: true,
      teacherName: true,
      schedule: true,
      location: true,
    },
  });

  if (!course) {
    return NextResponse.json({ message: "课程基础信息不存在" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const semesterKey = normalizeSemesterKey(body.semesterKey, getCurrentSemesterKey());
  const status = normalizeStatus(body.status);
  const startAt = parseIsoDate(body.startAt);
  const endAt = parseIsoDate(body.endAt);
  const forceClosedAt = parseIsoDate(body.forceClosedAt);

  const existingOffering = await prisma.courseOffering.findUnique({
    where: {
      courseId_semesterKey: {
        courseId,
        semesterKey,
      },
    },
  });

  const offering = existingOffering
    ? await prisma.courseOffering.update({
        where: {
          id: existingOffering.id,
        },
        data: {
          courseName: course.courseName,
          teacherName: course.teacherName,
          status,
          startAt,
          endAt,
          forceClosedAt,
        },
      })
    : await prisma.courseOffering.create({
        data: {
          courseId,
          courseName: course.courseName,
          teacherName: course.teacherName,
          semesterKey,
          status,
          startAt,
          endAt,
          forceClosedAt,
        },
      });

  const existingInvite = await prisma.courseInviteCode.findUnique({
    where: {
      offeringId: offering.id,
    },
  });

  const inviteCode =
    existingInvite ??
    (await prisma.courseInviteCode.create({
      data: {
        code: buildInviteCode(semesterKey),
        courseId,
        offeringId: offering.id,
        semesterKey,
      },
    }));

  const updatedInvite = existingInvite
    ? await prisma.courseInviteCode.update({
        where: { id: existingInvite.id },
        data: {
          courseId,
          semesterKey,
          isActive: true,
        },
      })
    : inviteCode;

  return NextResponse.json({
    offering: {
      id: offering.id,
      courseId: offering.courseId,
      courseName: offering.courseName,
      teacherName: offering.teacherName,
      semesterKey: offering.semesterKey,
      status: offering.status,
      startAt: offering.startAt?.toISOString() ?? null,
      endAt: offering.endAt?.toISOString() ?? null,
      forceClosedAt: offering.forceClosedAt?.toISOString() ?? null,
      createdAt: offering.createdAt.toISOString(),
      updatedAt: offering.updatedAt.toISOString(),
    },
    inviteCode: {
      id: updatedInvite.id,
      code: updatedInvite.code,
      courseId: updatedInvite.courseId,
      semesterKey: updatedInvite.semesterKey,
      isActive: updatedInvite.isActive,
      expiresAt: updatedInvite.expiresAt?.toISOString() ?? null,
    },
  });
}
