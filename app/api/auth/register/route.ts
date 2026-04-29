import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createVerificationToken } from "@/lib/auth/token";
import { checkRegisterRateLimit } from "@/lib/auth/rate-limit";
import { sendVerificationEmail } from "@/lib/email/send";

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

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRegisterRateLimit(request)) {
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
    const nickname = normalizeNickname(body.nickname, email);
    const password = normalizePassword(body.password);

    if (!email) {
      return NextResponse.json({ message: "邮箱不能为空" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "密码至少需要 6 位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ message: "该邮箱已注册，请直接登录" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name: nickname,
        passwordHash,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = await createVerificationToken(user.id, email);
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "注册成功，请查收验证邮件", email: user.email },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
