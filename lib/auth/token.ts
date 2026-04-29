import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerificationToken(userId: string, email: string) {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId, email, token, expiresAt },
  });

  return token;
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: { id: true, userId: true, email: true, expiresAt: true },
  });

  if (!record) return { error: "无效的验证链接" as const };
  if (new Date() > record.expiresAt) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { error: "验证链接已过期，请重新发送" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  return { success: true, userId: record.userId, email: record.email };
}
