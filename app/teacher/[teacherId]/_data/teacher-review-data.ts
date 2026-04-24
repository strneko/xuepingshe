import { ReviewItem, ReviewPageResult } from "../../../course/[courseId]/_types";
import { prisma } from "@/lib/prisma";
import { getTeacherSource } from "./teacher-profile-data";

const DEFAULT_REVIEW_PAGE_SIZE = 10;

function normalizeReviewLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_REVIEW_PAGE_SIZE;
  }

  return Math.min(20, Math.max(1, Math.floor(limit)));
}

function createReviewCursor(review: ReviewItem) {
  return `${review.createdAt}__${review.id}`;
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReviewScoreItem(value: unknown): value is {
  key: string;
  label: string;
  score: number | null;
  weight?: number;
  subItems?: Array<{ key: string; label: string; score: number | null; weight?: number }>;
} {
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

function mapTeacherReviewRowToItem(row: {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  sourceCourseId: string | null;
  sourceCourseName: string | null;
  sourceTeacherId?: string;
  sourceTeacherName?: string;
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
    sourceCourseId: row.sourceCourseId ?? undefined,
    sourceCourseName: row.sourceCourseName ?? undefined,
    sourceTeacherId: row.sourceTeacherId,
    sourceTeacherName: row.sourceTeacherName,
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

  const rows = await prisma.teacherReviewLike.findMany({
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
  const pageSize = normalizeReviewLimit(limit);
  const startIndex = cursor ? reviews.findIndex((item) => createReviewCursor(item) === cursor) + 1 : 0;
  const safeStartIndex = Math.max(0, startIndex);
  const items = reviews.slice(safeStartIndex, safeStartIndex + pageSize);
  const nextItem = reviews[safeStartIndex + pageSize];

  return {
    items,
    nextCursor: nextItem ? createReviewCursor(nextItem) : null,
    hasMore: Boolean(nextItem),
    total: reviews.length,
  };
}

export async function getTeacherReviewsPage(
  teacherId: string,
  cursor: string | null,
  limit?: number,
  currentUserId?: string | null,
): Promise<ReviewPageResult> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = await getTeacherSource(teacherId);
  const rows = await prisma.teacherReview.findMany({
    where: {
      teacherId,
      status: "VISIBLE",
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      sourceCourseId: true,
      sourceCourseName: true,
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
  const items = rows.map((row) =>
    mapTeacherReviewRowToItem({
      ...row,
      liked: likedReviewIds.has(row.id),
      sourceTeacherId: detail.teacherId,
      sourceTeacherName: detail.teacherName,
    }),
  );

  return getReviewPageFromList(items, cursor, limit);
}

export async function getTeacherTopReviews(teacherId: string, currentUserId?: string | null): Promise<ReviewItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = await getTeacherSource(teacherId);
  const rows = await prisma.teacherReview.findMany({
    where: {
      teacherId,
      status: "VISIBLE",
    },
    orderBy: [{ likesCount: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      sourceCourseId: true,
      sourceCourseName: true,
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

  return rows.map((row) =>
    mapTeacherReviewRowToItem({
      ...row,
      liked: likedReviewIds.has(row.id),
      sourceTeacherId: detail.teacherId,
      sourceTeacherName: detail.teacherName,
    }),
  );
}
