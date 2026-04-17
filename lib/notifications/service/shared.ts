import { prisma } from "@/lib/prisma";
import { NotificationError } from "../errors";

const DEMO_USER_ID = "demo-user";

export async function ensureDemoUser() {
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

export async function resolveCurrentUserId(headerUserId?: string | null) {
  const userId = headerUserId?.trim() || (await ensureDemoUser());

  if (!userId) {
    throw new NotificationError("用户未登录", 401, "UNAUTHORIZED");
  }

  return userId;
}

export function parseLimit(raw: string | null, options: { defaultValue: number; maxValue: number }) {
  if (!raw) {
    return options.defaultValue;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new NotificationError("limit 参数非法", 400, "INVALID_LIMIT");
  }

  return Math.min(Math.trunc(value), options.maxValue);
}

export function parseEventId(raw: string | null, code: string) {
  if (!raw) {
    throw new NotificationError("eventId 参数缺失", 400, code);
  }

  if (!/^\d+$/.test(raw)) {
    throw new NotificationError("eventId 参数非法", 400, code);
  }

  return BigInt(raw);
}

export function parseOptionalCursor(raw: string | null) {
  if (!raw) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    throw new NotificationError("cursor 参数非法", 400, "INVALID_CURSOR");
  }

  return BigInt(raw);
}

export function parseBoolean(raw: string | null) {
  if (!raw) {
    return false;
  }

  return raw === "true";
}
