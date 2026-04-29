import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { buildUserProfile } from "@/lib/auth/profile";
import { createAuthSessionToken, setAuthSessionCookie } from "@/lib/auth/session";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeRememberMe(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

const DAY_SECONDS = 24 * 60 * 60;
const DEFAULT_MAX_AGE = DAY_SECONDS;
const REMEMBER_MAX_AGE = 30 * DAY_SECONDS;

export async function POST(request: NextRequest) {
  try {
    if (!checkLoginRateLimit(request)) {
      return NextResponse.json({ message: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "请求体无效" }, { status: 400 });
    }

    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const rememberMe = normalizeRememberMe(body.rememberMe);

    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ message: "密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "账号不存在" }, { status: 404 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ message: "密码错误" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ message: "请先验证邮箱后再登录" }, { status: 401 });
    }

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
      { maxAge: rememberMe ? REMEMBER_MAX_AGE : DEFAULT_MAX_AGE },
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
