import { NextRequest, NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/auth/session";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ message: "已退出登录" });
  clearAuthSessionCookie(response);
  return response;
}
