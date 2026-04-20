import { NextRequest, NextResponse } from "next/server";
import { buildUserProfile } from "@/lib/auth/profile";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const user = await buildUserProfile(userId);
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取登录态失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
