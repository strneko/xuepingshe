import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    courseId: string;
    offeringId: string;
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录后再更新开课状态" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ message: "只有教师可以更新开课状态" }, { status: 403 });
  }

  const { courseId, offeringId } = await context.params;

  const offering = await prisma.courseOffering.findFirst({
    where: {
      id: offeringId,
      courseId,
    },
  });

  if (!offering) {
    return NextResponse.json({ message: "开课实例不存在" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const targetStatus = normalizeStatus(body.status);

  if (targetStatus === "CLOSED") {
    const activeRounds = await prisma.reviewRound.count({
      where: {
        offeringId,
        startsAt: { lte: new Date() },
        endsAt: { gt: new Date() },
      },
    });

    if (activeRounds > 0) {
      return NextResponse.json(
        { message: "该开课存在进行中的评教轮次，无法结课" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.courseOffering.update({
    where: { id: offering.id },
    data: {
      status: targetStatus,
      startAt: parseIsoDate(body.startAt),
      endAt: parseIsoDate(body.endAt),
      forceClosedAt: parseIsoDate(body.forceClosedAt),
    },
  });

  const inviteCode = await prisma.courseInviteCode.findUnique({
    where: { offeringId: updated.id },
  });

  return NextResponse.json({
    offering: {
      id: updated.id,
      courseId: updated.courseId,
      courseName: updated.courseName,
      teacherName: updated.teacherName,
      semesterKey: updated.semesterKey,
      status: updated.status,
      startAt: updated.startAt?.toISOString() ?? null,
      endAt: updated.endAt?.toISOString() ?? null,
      forceClosedAt: updated.forceClosedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
    inviteCode: inviteCode
      ? {
          id: inviteCode.id,
          code: inviteCode.code,
          courseId: inviteCode.courseId,
          semesterKey: inviteCode.semesterKey,
          isActive: inviteCode.isActive,
          expiresAt: inviteCode.expiresAt?.toISOString() ?? null,
        }
      : null,
  });
}
