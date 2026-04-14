import type { ReviewItem, ReviewScoreItem } from "@/app/course/[courseId]/_types";

export type SearchDocumentType = "COURSE" | "TEACHER";

export interface SearchDocumentRecord {
  docType: SearchDocumentType;
  docId: string;
  title: string;
  subtitle: string;
  department: string;
  scoreSnapshot: number;
  reviewCountSnapshot: number;
  snippet: string;
}

export interface SearchResultItem {
  id: string;
  type: "course" | "teacher";
  title: string;
  subtitle: string;
  department: string;
  score: number;
  reviewCount: number;
  snippet: string;
  href: string;
}

export interface RecommendedReviewRecord {
  reviewId: string;
  nickname: string;
  sourceCourseId: string | null;
  sourceCourseName: string | null;
  sourceTeacherId: string | null;
  sourceTeacherName: string | null;
  createdAt: Date;
  overallScore: number | null;
  likesCount: number;
  summary: string;
  detailedScoresJson: unknown;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function computeRelevance(item: SearchResultItem, keyword: string) {
  if (!keyword) {
    return 0;
  }

  const target = `${item.title} ${item.subtitle} ${item.department} ${item.snippet}`.toLowerCase();
  if (!target.includes(keyword)) {
    return -1;
  }

  let score = 1;
  if (item.title.toLowerCase().includes(keyword)) score += 3;
  if (item.subtitle.toLowerCase().includes(keyword)) score += 2;
  if (item.snippet.toLowerCase().includes(keyword)) score += 1;
  return score;
}

export function toSearchResultItem(record: SearchDocumentRecord): SearchResultItem {
  const type = record.docType === "COURSE" ? "course" : "teacher";

  return {
    id: record.docId,
    type,
    title: record.title,
    subtitle: record.subtitle,
    department: record.department,
    score: record.scoreSnapshot,
    reviewCount: record.reviewCountSnapshot,
    snippet: record.snippet,
    href: type === "course" ? `/course/${record.docId}` : `/teacher/${record.docId}`,
  };
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReviewScoreItem(value: unknown): value is ReviewScoreItem {
  if (!isRecordLike(value)) {
    return false;
  }

  return typeof value.key === "string" && typeof value.label === "string" && typeof value.score === "number";
}

export function parseDetailedScores(value: unknown): ReviewScoreItem[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter(isReviewScoreItem);
  return items.length > 0 ? items : undefined;
}

export function toRecommendedReviewItem(record: RecommendedReviewRecord): ReviewItem {
  return {
    id: record.reviewId,
    nickname: record.nickname,
    sourceCourseId: record.sourceCourseId ?? undefined,
    sourceCourseName: record.sourceCourseName ?? undefined,
    sourceTeacherId: record.sourceTeacherId ?? undefined,
    sourceTeacherName: record.sourceTeacherName ?? undefined,
    createdAt: record.createdAt.toISOString(),
    overallScore: record.overallScore,
    likesCount: record.likesCount,
    summary: record.summary,
    detailedScores: parseDetailedScores(record.detailedScoresJson),
  };
}
