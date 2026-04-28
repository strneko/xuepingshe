import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { buildInviteCode, getCurrentSemesterKey } from "@/lib/course-offerings";
import { prisma } from "@/lib/prisma";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function generateCourseId() {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const suffixPart = randomBytes(2).toString("hex").toUpperCase();
  return `C-${timestampPart}-${suffixPart}`;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再创建课程" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });

  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ message: "只有教师可以创建课程" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const courseName = normalizeText(body.courseName);
  const teacherName = normalizeText(body.teacherName) || user.name?.trim() || "";
  const intro = normalizeText(body.intro);
  const location = normalizeText(body.location);
  const schedule = normalizeText(body.schedule);

  if (!courseName || !teacherName || !intro || !location || !schedule) {
    return NextResponse.json({ message: "课程名称、教师、简介、地点、时间均为必填" }, { status: 400 });
  }

  const semesterKey = getCurrentSemesterKey();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const courseId = generateCourseId();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const course = await tx.courseProfile.create({
          data: {
            courseId,
            courseName,
            teacherName,
            intro,
            location,
            schedule,
          },
        });

        const offering = await tx.courseOffering.create({
          data: {
            courseId,
            courseName,
            teacherName,
            semesterKey,
            status: "OPEN",
          },
        });

        const inviteCode = await tx.courseInviteCode.create({
          data: {
            code: buildInviteCode(semesterKey),
            courseId,
            offeringId: offering.id,
            semesterKey,
            isActive: true,
          },
        });

        return { course, offering, inviteCode };
      });

      return NextResponse.json({
        message: "课程创建成功",
        course: {
          courseId: result.course.courseId,
          courseName: result.course.courseName,
          teacherName: result.course.teacherName,
          intro: result.course.intro,
          location: result.course.location,
          schedule: result.course.schedule,
          createdAt: result.course.createdAt.toISOString(),
          updatedAt: result.course.updatedAt.toISOString(),
        },
        offering: {
          id: result.offering.id,
          courseId: result.offering.courseId,
          semesterKey: result.offering.semesterKey,
          status: result.offering.status,
          createdAt: result.offering.createdAt.toISOString(),
          updatedAt: result.offering.updatedAt.toISOString(),
        },
        inviteCode: {
          id: result.inviteCode.id,
          code: result.inviteCode.code,
          courseId: result.inviteCode.courseId,
          semesterKey: result.inviteCode.semesterKey,
          isActive: result.inviteCode.isActive,
          expiresAt: result.inviteCode.expiresAt?.toISOString() ?? null,
          createdAt: result.inviteCode.createdAt.toISOString(),
          updatedAt: result.inviteCode.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  return NextResponse.json({ message: "课程创建失败，请稍后重试" }, { status: 500 });
}
