import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/audit-log";

const ACTION_FOLLOW = "PROFILE_FOLLOW";
const ACTION_UNFOLLOW = "PROFILE_UNFOLLOW";

function parseTargetUserId(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const targetUserId = (body as Record<string, unknown>).targetUserId;
  return typeof targetUserId === "string" ? targetUserId.trim() : "";
}

async function buildFollowResponse(userId: string, targetUserId: string, isFollowing: boolean) {
  const [followingCount, followerCount] = await Promise.all([
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.count({ where: { followingId: targetUserId } }),
  ]);

  return {
    isFollowing,
    followingCount,
    followerCount,
  };
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const targetUserId = parseTargetUserId(body);
  if (!targetUserId) {
    return NextResponse.json({ message: "目标用户无效" }, { status: 400 });
  }

  if (targetUserId === userId) {
    return NextResponse.json({ message: "不能关注自己" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ message: "目标用户不存在" }, { status: 404 });
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId,
      },
    },
    create: {
      followerId: userId,
      followingId: targetUserId,
    },
    update: {},
  });

  void writeAuditLog({
    userId,
    action: ACTION_FOLLOW,
    targetId: targetUserId,
  });

  return NextResponse.json(await buildFollowResponse(userId, targetUserId, true));
}

export async function DELETE(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const targetUserId = parseTargetUserId(body);
  if (!targetUserId) {
    return NextResponse.json({ message: "目标用户无效" }, { status: 400 });
  }

  if (targetUserId === userId) {
    return NextResponse.json({ message: "不能取消关注自己" }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  void writeAuditLog({
    userId,
    action: ACTION_UNFOLLOW,
    targetId: targetUserId,
  });

  return NextResponse.json(await buildFollowResponse(userId, targetUserId, false));
}
