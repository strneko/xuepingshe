import { ReviewItem, ReviewPageResult, ReviewScoreItem } from "../_types";
import { prisma } from "@/lib/prisma";

const DEFAULT_REVIEW_PAGE_SIZE = 10;

function normalizeLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_REVIEW_PAGE_SIZE;
  }

  return Math.min(20, Math.max(1, Math.floor(limit)));
}

function createCursor(review: ReviewItem) {
  return `${review.createdAt}__${review.id}`;
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReviewScoreItem(value: unknown): value is ReviewScoreItem {
  if (!isRecordLike(value)) {
    return false;
  }

  return typeof value.key === "string" && typeof value.label === "string";
}

function parseDetailedScores(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter(isReviewScoreItem);
  return items.length > 0 ? items : undefined;
}

function mapCourseReviewRowToItem(row: {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Date;
  overallScore: number | null;
  likesCount: number;
  summary: string;
  detailedScoresJson: unknown;
  liked?: boolean;
}): ReviewItem {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
    overallScore: row.overallScore,
    likesCount: row.likesCount,
    liked: row.liked ?? false,
    summary: row.summary,
    detailedScores: parseDetailedScores(row.detailedScoresJson),
  };
}

async function getLikedReviewIdSet(reviewIds: string[], userId?: string | null) {
  if (reviewIds.length === 0 || !userId) {
    return new Set<string>();
  }

  const rows = await prisma.courseReviewLike.findMany({
    where: {
      userId,
      reviewId: {
        in: reviewIds,
      },
    },
    select: {
      reviewId: true,
    },
  });

  return new Set(rows.map((row) => row.reviewId));
}

function getReviewPageFromList(reviews: ReviewItem[], cursor: string | null, limit?: number): ReviewPageResult {
  const pageSize = normalizeLimit(limit);
  const startIndex = cursor ? reviews.findIndex((item) => createCursor(item) === cursor) + 1 : 0;
  const safeStartIndex = Math.max(0, startIndex);
  const items = reviews.slice(safeStartIndex, safeStartIndex + pageSize);
  const nextItem = reviews[safeStartIndex + pageSize];

  return {
    items,
    nextCursor: nextItem ? createCursor(nextItem) : null,
    hasMore: Boolean(nextItem),
    total: reviews.length,
  };
}

export async function getCourseReviewsPage(
  courseId: string,
  cursor: string | null,
  limit?: number,
  currentUserId?: string | null,
): Promise<ReviewPageResult> {
  const rows = await prisma.courseReview.findMany({
    where: {
      courseId,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true,
      overallScore: true,
      likesCount: true,
      summary: true,
      detailedScoresJson: true,
    },
  });

  if (rows.length === 0) {
    return getReviewPageFromList([], cursor, limit);
  }

  const likedReviewIds = await getLikedReviewIdSet(
    rows.map((row) => row.id),
    currentUserId,
  );
  const items = rows.map((row) => mapCourseReviewRowToItem({ ...row, liked: likedReviewIds.has(row.id) }));
  return getReviewPageFromList(items, cursor, limit);
}

export async function getCourseTopReviews(courseId: string, currentUserId?: string | null): Promise<ReviewItem[]> {
  const rows = await prisma.courseReview.findMany({
    where: {
      courseId,
    },
    orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true,
      overallScore: true,
      likesCount: true,
      summary: true,
      detailedScoresJson: true,
    },
  });

  if (rows.length === 0) {
    return [];
  }

  const likedReviewIds = await getLikedReviewIdSet(
    rows.map((row) => row.id),
    currentUserId,
  );

  return rows.map((row) => mapCourseReviewRowToItem({ ...row, liked: likedReviewIds.has(row.id) }));
}
