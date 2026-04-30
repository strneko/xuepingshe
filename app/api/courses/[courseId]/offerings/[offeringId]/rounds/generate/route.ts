import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { ensureRounds } from "@/lib/review-round/service";

interface RouteContext {
  params: Promise<{ courseId: string; offeringId: string }>;
}

/** POST: auto-generate rounds from schedule */
export async function POST(request: NextRequest, context: RouteContext) {
  const { courseId, offeringId } = await context.params;

  const sessionUserId = getSessionUserId(request.headers);
  if (!sessionUserId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });
  if (user?.role !== "TEACHER") {
    return NextResponse.json({ message: "仅教师可管理评价轮次" }, { status: 403 });
  }

  const offering = await prisma.courseOffering.findUnique({
    where: { id: offeringId },
    select: { id: true, courseId: true, startAt: true, endAt: true },
  });

  if (!offering) {
    return NextResponse.json({ message: "开课记录不存在" }, { status: 404 });
  }
  if (!offering.startAt || !offering.endAt) {
    return NextResponse.json({ message: "开课记录缺少起止日期，无法自动生成轮次" }, { status: 400 });
  }

  const profile = await prisma.courseProfile.findUnique({
    where: { courseId: offering.courseId },
    select: { schedule: true },
  });

  if (!profile?.schedule) {
    return NextResponse.json({ message: "课程未设置上课时间，无法自动生成轮次" }, { status: 400 });
  }

  const rounds = await ensureRounds({
    offeringId: offering.id,
    courseId: offering.courseId,
    schedule: profile.schedule,
    semesterStart: offering.startAt,
    semesterEnd: offering.endAt,
  });

  if (rounds.length === 0) {
    return NextResponse.json({ message: "无法从上课时间解析出轮次，请手动添加" }, { status: 400 });
  }

  const result = rounds.map((r) => ({
    id: r.id,
    label: r.label,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ rounds: result }, { status: 201 });
}
