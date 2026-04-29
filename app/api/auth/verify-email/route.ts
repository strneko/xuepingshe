import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/auth/token";
import { buildUserProfile } from "@/lib/auth/profile";
import { createAuthSessionToken, setAuthSessionCookie } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ message: "缺少验证令牌" }, { status: 400 });
    }

    const result = await consumeVerificationToken(token);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    // 验证成功后自动登录
    const profile = await buildUserProfile(result.userId);
    if (!profile) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    const response = NextResponse.redirect(
      new URL("/", request.url),
    );
    setAuthSessionCookie(
      response,
      createAuthSessionToken({
        userId: result.userId,
        email: result.email,
        nickname: profile.nickname,
      }),
      { maxAge: 24 * 60 * 60 },
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "验证失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
