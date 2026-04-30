import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ courseId: string; offeringId: string; roundId: string }>;
}

/** DELETE: remove a round (only if no reviews have been submitted) */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { roundId } = await context.params;

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

  const round = await prisma.reviewRound.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!round) {
    return NextResponse.json({ message: "轮次不存在" }, { status: 404 });
  }

  if (round._count.reviews > 0) {
    return NextResponse.json({ message: "该轮次已有评价，无法删除" }, { status: 409 });
  }

  await prisma.reviewRound.delete({ where: { id: roundId } });

  return NextResponse.json({ success: true });
}
