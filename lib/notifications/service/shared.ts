import { getSessionUserId } from "@/lib/auth/session";
import { NotificationError } from "../errors";

export async function resolveCurrentUserId(source?: unknown) {
  const userId = getSessionUserId(source);

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
