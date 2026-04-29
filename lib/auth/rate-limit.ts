import { NextRequest } from "next/server";

type RateLimitBucket = { count: number; resetAt: number };

const loginBuckets = new Map<string, RateLimitBucket>();
const registerBuckets = new Map<string, RateLimitBucket>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

function checkRateLimit(buckets: Map<string, RateLimitBucket>, ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function checkLoginRateLimit(request: NextRequest): boolean {
  return checkRateLimit(loginBuckets, getClientIp(request));
}

export function checkRegisterRateLimit(request: NextRequest): boolean {
  return checkRateLimit(registerBuckets, getClientIp(request));
}
