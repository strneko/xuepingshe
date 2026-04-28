import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildUserProfile } from "@/lib/auth/profile";
import { createAuthSessionToken, setAuthSessionCookie } from "@/lib/auth/session";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function defaultNicknameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "用户";
  return (localPart.trim() || "用户").slice(0, 20);
}

function normalizeRole(value: unknown) {
  return value === "TEACHER" || value === "STUDENT" ? value : null;
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
    const role = normalizeRole(body.role);

    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: role ? { role } : {},
      create: {
        email,
        name: defaultNicknameFromEmail(email),
        role: role ?? "STUDENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const profile = await buildUserProfile(user.id);
    if (!profile) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
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
    const message = error instanceof Error ? error.message : "登录失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
