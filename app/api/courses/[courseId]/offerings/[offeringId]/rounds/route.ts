import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ courseId: string; offeringId: string }>;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeDate(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value.trim());
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** GET: list all rounds for an offering */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { courseId, offeringId } = await context.params;

  const rounds = await prisma.reviewRound.findMany({
    where: { offeringId, courseId },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      label: true,
      startsAt: true,
      endsAt: true,
      aggregated: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  const result = rounds.map((r) => ({
    id: r.id,
    label: r.label,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    aggregated: r.aggregated,
    createdAt: r.createdAt.toISOString(),
    reviewCount: r._count.reviews,
  }));

  return NextResponse.json({ rounds: result });
}

/** POST: create a new round manually */
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const label = normalizeString(body.label, "");
  const startsAt = normalizeDate(body.startsAt);
  const endsAt = normalizeDate(body.endsAt);

  if (!label) {
    return NextResponse.json({ message: "轮次名称不能为空" }, { status: 400 });
  }
  if (!startsAt || !endsAt) {
    return NextResponse.json({ message: "起止时间为必填" }, { status: 400 });
  }
  if (startsAt >= endsAt) {
    return NextResponse.json({ message: "开始时间必须早于结束时间" }, { status: 400 });
  }

  try {
    const round = await prisma.reviewRound.create({
      data: { offeringId, courseId, label, startsAt, endsAt },
      select: {
        id: true,
        label: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        _count: { select: { reviews: true } },
      },
    });

    return NextResponse.json(
      {
        id: round.id,
        label: round.label,
        startsAt: round.startsAt.toISOString(),
        endsAt: round.endsAt.toISOString(),
        createdAt: round.createdAt.toISOString(),
        reviewCount: round._count.reviews,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint")
      ? "该轮次名称已存在"
      : "创建轮次失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
