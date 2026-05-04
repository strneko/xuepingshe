import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request.headers);
  if (!userId) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "请求体无效" }, { status: 400 });
  }

  const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ message: "请填写旧密码和新密码" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ message: "新密码长度至少为6个字符" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "旧密码错误" }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ message: "密码修改成功" });
}
