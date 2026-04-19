import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "demo-user";

export type CommunitySort = "latest-post" | "latest-reply" | "hottest";

export async function resolveCurrentUserId(headerUserId?: string | null) {
  const userId = headerUserId?.trim() || (await ensureDemoUser());

  if (!userId) {
    throw new Error("用户未登录");
  }

  return userId;
}

async function ensureDemoUser() {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
    create: {
      id: DEMO_USER_ID,
      email: "demo-user@xuepingshe.local",
      name: "Demo User",
    },
  });

  return DEMO_USER_ID;
}

export function parseLimit(raw: string | null, options: { defaultValue: number; maxValue: number }) {
  if (!raw) {
    return options.defaultValue;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("limit 参数非法");
  }

  return Math.min(Math.trunc(value), options.maxValue);
}

export function parseOffsetCursor(raw: string | null) {
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("cursor 参数非法");
  }

  return Math.trunc(value);
}

export function parseSort(raw: string | null): CommunitySort {
  if (raw === "latest-reply" || raw === "hottest") {
    return raw;
  }

  return "latest-post";
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function computeHotScore(likeCount: number, commentCount: number, createdAt: Date) {
  const ageInHours = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  const decay = Math.max(0, Math.round(24 - ageInHours));
  return likeCount * 2 + commentCount * 3 + decay;
}
