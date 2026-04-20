import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildUserProfile } from "@/lib/auth/profile";
import { createAuthSessionToken, setAuthSessionCookie } from "@/lib/auth/session";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeNickname(value: unknown, email: string) {
  const nickname = typeof value === "string" ? value.trim() : "";
  if (nickname) {
    return nickname.slice(0, 20);
  }

  const localPart = email.split("@")[0] ?? "用户";
  return localPart.slice(0, 20) || "用户";
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const email = normalizeEmail(body.email);
    const nickname = normalizeNickname(body.nickname, email);

    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ message: "该邮箱已注册，请直接登录" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: nickname,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const profile = await buildUserProfile(user.id);
    if (!profile) {
      return NextResponse.json({ message: "用户创建失败" }, { status: 500 });
    }

    const response = NextResponse.json({ user: profile });
    setAuthSessionCookie(
      response,
      createAuthSessionToken({
        userId: user.id,
        email: user.email,
        nickname: profile.nickname,
      }),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
