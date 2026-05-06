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
  searchableText?: string | null;
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

  // Use searchableText if available, otherwise fall back to field concatenation
  const target = ((item as unknown as { searchableText?: string | null }).searchableText
    ?? `${item.title} ${item.subtitle} ${item.department} ${item.snippet}`
  ).toLowerCase();

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
    searchableText: record.searchableText ?? undefined,
  } as SearchResultItem & { searchableText?: string };
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

const DIMENSION_LABEL_MAP: Record<string, string> = {
  attitude: "教学态度与师德",
  content: "教学内容与设计",
  method: "教学方法与技巧",
  effect: "教学效果与成果",
  interaction: "师生互动与氛围",
  resource: "课程资源与评价",
  improve: "教学创新与改进",
};

export function parseDetailedScores(value: unknown): ReviewScoreItem[] | undefined {
  if (Array.isArray(value)) {
    const items = value.filter(isReviewScoreItem);
    return items.length > 0 ? items : undefined;
  }

  // Handle plain object format: { attitude: 4.8, content: 4.7, ... }
  if (isRecordLike(value)) {
    const items: ReviewScoreItem[] = [];
    for (const [key, label] of Object.entries(DIMENSION_LABEL_MAP)) {
      const score = value[key];
      if (typeof score === "number" && !Number.isNaN(score)) {
        items.push({ key, label, score });
      }
    }
    if (items.length > 0) return items;
  }

  return undefined;
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
