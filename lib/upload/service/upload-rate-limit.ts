import { prisma } from "@/lib/prisma";

/** Max upload init requests per user per window. Configurable via UPLOAD_RATE_LIMIT_PER_HOUR, default 10 */
function readUploadRateLimit(): number {
  const n = Number(process.env.UPLOAD_RATE_LIMIT_PER_HOUR);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

/** Max part uploads per session per minute. Configurable via UPLOAD_PART_RATE_LIMIT_PER_MIN, default 60 */
function readPartRateLimit(): number {
  const n = Number(process.env.UPLOAD_PART_RATE_LIMIT_PER_MIN);
  return Number.isFinite(n) && n > 0 ? n : 60;
}

/**
 * Check if a user has exceeded the upload init rate limit.
 * Throws an UploadRateLimitError if limit exceeded.
 */
export async function checkUploadInitRateLimit(userId: string): Promise<void> {
  const maxPerHour = readUploadRateLimit();
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const count = await prisma.resourceUploadSession.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });

  if (count >= maxPerHour) {
    throw new UploadRateLimitError(maxPerHour);
  }
}

/**
 * Check if a user has exceeded the part upload rate limit for a session.
 */
export async function checkUploadPartRateLimit(uploadId: string): Promise<void> {
  const maxPerMin = readPartRateLimit();
  const since = new Date(Date.now() - 60 * 1000);

  const count = await prisma.resourceUploadPart.count({
    where: {
      uploadId,
      createdAt: { gte: since },
    },
  });

  if (count >= maxPerMin) {
    throw new UploadPartRateLimitError(maxPerMin);
  }
}

export class UploadRateLimitError extends Error {
  code = "UPLOAD_RATE_LIMITED" as const;
  status = 429;
  constructor(max: number) {
    super(`每小时最多发起 ${max} 次上传，请稍后再试`);
    this.name = "UploadRateLimitError";
  }
}

export class UploadPartRateLimitError extends Error {
  code = "UPLOAD_PART_RATE_LIMITED" as const;
  status = 429;
  constructor(max: number) {
    super(`每分钟最多上传 ${max} 个分片，请稍后重试`);
    this.name = "UploadPartRateLimitError";
  }
}
