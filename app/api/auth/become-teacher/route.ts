import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { syncTeacherSearchDocument } from "@/lib/search/sync";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 401 });
  }

  if (user.role === "TEACHER") {
    return NextResponse.json({ message: "您已是教师身份" }, { status: 409 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const teacherCode = process.env.TEACHER_CODE;

  if (!teacherCode) {
    return NextResponse.json({ message: "教师认证功能未配置" }, { status: 500 });
  }

  if (!code || code !== teacherCode) {
    return NextResponse.json({ message: "教师码无效" }, { status: 403 });
  }

  // Switch role
  await prisma.user.update({
    where: { id: userId },
    data: { role: "TEACHER" },
  });

  // Sync search document (best-effort)
  syncTeacherSearchDocument(userId).catch(() => {});

  return NextResponse.json({ message: "认证成功，您已成为教师" });
}
