import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const AUTH_SESSION_COOKIE = "xuepingshe_session";
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AuthSessionPayload = {
  userId: string;
  email: string;
  nickname: string;
  issuedAt: number;
  expiresAt: number;
};

function getAuthSecret() {
  return process.env.AUTH_SESSION_SECRET?.trim() || "xuepingshe-dev-auth-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAuthSessionToken(input: { userId: string; email: string; nickname: string }) {
  const payload: AuthSessionPayload = {
    userId: input.userId,
    email: input.email,
    nickname: input.nickname,
    issuedAt: Date.now(),
    expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readAuthSessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthSessionPayload;
    if (!payload.userId || !payload.email || !payload.nickname) {
      return null;
    }

    if (!Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getCookieHeader(source: unknown) {
  if (!source) {
    return null;
  }

  if (typeof source === "string") {
    return null;
  }

  if (source instanceof Headers) {
    return source.get("cookie");
  }

  if (typeof source === "object" && source && "headers" in source) {
    const headers = (source as { headers?: Headers | { get: (name: string) => string | null } }).headers;
    if (!headers) {
      return null;
    }

    if (headers instanceof Headers) {
      return headers.get("cookie");
    }

    return headers.get("cookie");
  }

  return null;
}

export function getHeaderValue(source: unknown, headerName: string) {
  if (!source || typeof source === "string") {
    return null;
  }

  if (source instanceof Headers) {
    return source.get(headerName);
  }

  if (typeof source === "object" && source && "headers" in source) {
    const headers = (source as { headers?: Headers | { get: (name: string) => string | null } }).headers;
    if (!headers) {
      return null;
    }

    return headers.get(headerName);
  }

  return null;
}

export function getSessionUserId(source: unknown) {
  if (typeof source === "string") {
    const trimmed = source.trim();
    return trimmed || null;
  }

  const cookieHeader = getCookieHeader(source);
  if (!cookieHeader) {
    return null;
  }

  const sessionCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_SESSION_COOKIE}=`));

  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.slice(AUTH_SESSION_COOKIE.length + 1);
  const session = readAuthSessionToken(token);
  return session?.userId ?? null;
}

export function setAuthSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(AUTH_SESSION_TTL_MS / 1000),
  });
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
