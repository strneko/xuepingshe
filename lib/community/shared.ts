import { getSessionUserId } from "@/lib/auth/session";

export type CommunitySort = "latest-post" | "latest-reply" | "hottest";

export async function resolveCurrentUserId(source?: unknown) {
  const userId = getSessionUserId(source);

  if (!userId) {
    throw new Error("用户未登录");
  }

  return userId;
}

export async function resolveOptionalCurrentUserId(source?: unknown) {
  return getSessionUserId(source);
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
