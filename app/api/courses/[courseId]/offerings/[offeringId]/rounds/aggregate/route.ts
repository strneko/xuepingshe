import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { aggregateRound } from "@/lib/score-history/aggregator";

interface RouteContext {
  params: Promise<{ courseId: string; offeringId: string }>;
}

/** POST: manually aggregate ended rounds for an offering */
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
    return NextResponse.json({ message: "仅教师可执行聚合" }, { status: 403 });
  }

  const now = new Date();
  const pendingRounds = await prisma.reviewRound.findMany({
    where: {
      offeringId,
      courseId,
      endsAt: { lt: now },
      aggregated: false,
    },
    select: { id: true },
  });

  let count = 0;
  for (const round of pendingRounds) {
    const aggregated = await aggregateRound(round.id);
    if (aggregated) count++;
  }

  return NextResponse.json({ rounds: count });
}
