import {
  HistoryScoreItem,
  HistoryScorePageResult,
  ReviewItem,
  ReviewPageResult,
  ScoreHistoryGranularity,
} from "../../../course/[courseId]/_types";
import { TeacherDetailData } from "../_types";

const DEFAULT_REVIEW_PAGE_SIZE = 10;
const DEFAULT_HISTORY_PAGE_SIZE = 12;

interface FakeTeacherDetailRecord extends Omit<TeacherDetailData, "initialReviews" | "initialHistoryScores"> {
  reviews: ReviewItem[];
}

const fakeTeacherDetails: Record<string, FakeTeacherDetailRecord> = {
  "1": {
    teacherId: "1",
    teacherName: "张教授",
    avatarUrl: "",
    department: "数学与统计学院",
    title: "教授 / 博导",
    researchAreas: ["偏微分方程", "最优化理论", "数学建模"],
    office: "理科楼 B-512",
    description:
      "长期从事高等数学与数学建模教学，注重基础概念与应用能力结合。主持多项教学改革项目，致力于提升课堂互动与学习反馈质量。",
    recentOverallScore: 4.82,
    recentSevenScores: [
      { key: "attitude", label: "教学态度与师德", score: 4.9 },
      { key: "content", label: "教学内容与设计", score: 4.8 },
      { key: "method", label: "教学方法与技巧", score: 4.8 },
      { key: "effect", label: "教学效果与成果", score: 4.7 },
      { key: "interaction", label: "师生互动与氛围", score: 4.9 },
      { key: "resource", label: "课程资源与评价", score: 4.7 },
      { key: "improve", label: "教学创新与改进", score: 4.9 },
    ],
    reviews: [
      {
        id: "tr-1",
        nickname: "匿名同学E",
        avatarUrl: "",
        sourceCourseId: "1",
        sourceCourseName: "高等数学",
        createdAt: "2026-03-03",
        overallScore: 4.9,
        likesCount: 131,
        summary: "讲课逻辑清晰，板书结构很强，例题讲解层次分明。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.9 },
          { key: "content", label: "教学内容与设计", score: 4.8 },
          { key: "method", label: "教学方法与技巧", score: 5.0 },
          { key: "effect", label: "教学效果与成果", score: 4.7 },
          { key: "interaction", label: "师生互动与氛围", score: 4.9 },
          { key: "resource", label: "课程资源与评价", score: 4.8 },
          { key: "improve", label: "教学创新与改进", score: 4.8 },
        ],
      },
      {
        id: "tr-2",
        nickname: "匿名同学F",
        avatarUrl: "",
        sourceCourseId: "2",
        sourceCourseName: "线性代数",
        createdAt: "2026-02-25",
        overallScore: 4.6,
        likesCount: 88,
        summary: "课堂互动多，课后答疑及时，作业反馈详细。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.7 },
          { key: "content", label: "教学内容与设计", score: 4.6 },
          { key: "method", label: "教学方法与技巧", score: 4.5 },
          { key: "effect", label: "教学效果与成果", score: 4.4 },
          { key: "interaction", label: "师生互动与氛围", score: 4.8 },
          { key: "resource", label: "课程资源与评价", score: 4.6 },
          { key: "improve", label: "教学创新与改进", score: 4.5 },
        ],
      },
      {
        id: "tr-3",
        nickname: "匿名同学G",
        avatarUrl: "",
        sourceCourseId: "3",
        sourceCourseName: "概率论与数理统计",
        createdAt: "2026-02-19",
        overallScore: 4.7,
        likesCount: 74,
        summary: "知识点串联很好，复习资料组织清楚，建议多给进阶题。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.8 },
          { key: "content", label: "教学内容与设计", score: 4.7 },
          { key: "method", label: "教学方法与技巧", score: 4.6 },
          { key: "effect", label: "教学效果与成果", score: 4.6 },
          { key: "interaction", label: "师生互动与氛围", score: 4.8 },
          { key: "resource", label: "课程资源与评价", score: 4.6 },
          { key: "improve", label: "教学创新与改进", score: 4.7 },
        ],
      },
      {
        id: "tr-4",
        nickname: "匿名同学H",
        avatarUrl: "",
        sourceCourseId: "1",
        sourceCourseName: "高等数学",
        createdAt: "2026-02-10",
        overallScore: 4.3,
        likesCount: 39,
        summary: "整体不错，希望增加难度分层练习。",
        detailedScores: [
          { key: "attitude", label: "教学态度与师德", score: 4.4 },
          { key: "content", label: "教学内容与设计", score: 4.2 },
          { key: "method", label: "教学方法与技巧", score: 4.1 },
          { key: "effect", label: "教学效果与成果", score: 4.2 },
          { key: "interaction", label: "师生互动与氛围", score: 4.5 },
          { key: "resource", label: "课程资源与评价", score: 4.2 },
          { key: "improve", label: "教学创新与改进", score: 4.1 },
        ],
      },
    ],
    topReviews: [
      {
        id: "tr-1",
        nickname: "匿名同学E",
        avatarUrl: "",
        sourceCourseId: "1",
        sourceCourseName: "高等数学",
        createdAt: "2026-03-03",
        overallScore: 4.9,
        likesCount: 131,
        summary: "讲课逻辑清晰，板书结构很强，例题讲解层次分明。",
      },
      {
        id: "tr-2",
        nickname: "匿名同学F",
        avatarUrl: "",
        sourceCourseId: "2",
        sourceCourseName: "线性代数",
        createdAt: "2026-02-25",
        overallScore: 4.6,
        likesCount: 88,
        summary: "课堂互动多，课后答疑及时，作业反馈详细。",
      },
    ],
  },
};

function normalizeReviewLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_REVIEW_PAGE_SIZE;
  }

  return Math.min(20, Math.max(1, Math.floor(limit)));
}

function normalizeHistoryLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_HISTORY_PAGE_SIZE;
  }

  return Math.min(30, Math.max(1, Math.floor(limit)));
}

function createReviewCursor(review: ReviewItem) {
  return `${review.createdAt}__${review.id}`;
}

function createHistoryCursor(item: HistoryScoreItem) {
  return item.id;
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

function formatMonthLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatDayLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function createTimeLabel(granularity: ScoreHistoryGranularity, index: number) {
  if (granularity === "semester") {
    const startYear = 2025 - Math.floor(index / 2);
    const endYear = startYear + 1;
    const semester = (index % 2) + 1;
    return `${startYear}-${endYear}-${semester}`;
  }

  if (granularity === "year") {
    return String(2026 - index);
  }

  if (granularity === "month") {
    const date = new Date(2026, 2, 1);
    date.setMonth(date.getMonth() - index);
    return formatMonthLabel(date);
  }

  const date = new Date(2026, 2, 4);
  date.setDate(date.getDate() - index);
  return formatDayLabel(date);
}

function toNullableScore(value: number, seed: number, mod: number) {
  if ((seed + mod) % 17 === 0) {
    return null;
  }

  return Number(value.toFixed(1));
}

function createHistoryScoreRecord(
  teacherId: string,
  granularity: ScoreHistoryGranularity,
  index: number,
): HistoryScoreItem {
  const id = `${granularity}-${teacherId}-${index + 1}`;
  const seed = teacherId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 19;

  const base = 3.9 + (seed % 10) / 10;
  const attitude = toNullableScore(Math.min(5, base - 0.1 + ((seed + 1) % 4) / 10), seed, 1);
  const content = toNullableScore(Math.min(5, base - 0.2 + ((seed + 2) % 5) / 10), seed, 2);
  const method = toNullableScore(Math.min(5, base - 0.3 + ((seed + 3) % 6) / 10), seed, 3);
  const effect = toNullableScore(Math.min(5, base - 0.3 + ((seed + 4) % 5) / 10), seed, 4);
  const interaction = toNullableScore(Math.min(5, base - 0.1 + ((seed + 5) % 4) / 10), seed, 5);
  const resource = toNullableScore(Math.min(5, base - 0.2 + ((seed + 6) % 5) / 10), seed, 6);
  const improve = toNullableScore(Math.min(5, base - 0.2 + ((seed + 7) % 5) / 10), seed, 7);

  const scoreValues = [attitude, content, method, effect, interaction, resource, improve].filter(
    (item): item is number => item !== null,
  );
  const overallScore =
    scoreValues.length > 0
      ? Number((scoreValues.reduce((sum, item) => sum + item, 0) / scoreValues.length).toFixed(1))
      : null;

  return {
    id,
    timeLabel: createTimeLabel(granularity, index),
    overallScore,
    attitude,
    content,
    method,
    effect,
    interaction,
    resource,
    improve,
  };
}

function getHistorySourceCount(granularity: ScoreHistoryGranularity) {
  if (granularity === "semester") {
    return 24;
  }

  if (granularity === "year") {
    return 12;
  }

  if (granularity === "month") {
    return 36;
  }

  return 120;
}

function buildHistorySource(teacherId: string, granularity: ScoreHistoryGranularity) {
  const count = getHistorySourceCount(granularity);

  return Array.from({ length: count }, (_, index) => createHistoryScoreRecord(teacherId, granularity, index));
}

function getHistoryPageFromList(
  historyList: HistoryScoreItem[],
  cursor: string | null,
  limit?: number,
): HistoryScorePageResult {
  const pageSize = normalizeHistoryLimit(limit);
  const startIndex = cursor ? historyList.findIndex((item) => createHistoryCursor(item) === cursor) + 1 : 0;
  const safeStartIndex = Math.max(0, startIndex);
  const items = historyList.slice(safeStartIndex, safeStartIndex + pageSize);
  const nextItem = historyList[safeStartIndex + pageSize];

  return {
    items,
    nextCursor: nextItem ? createHistoryCursor(nextItem) : null,
    hasMore: Boolean(nextItem),
    total: historyList.length,
  };
}

function getTeacherSource(teacherId: string): FakeTeacherDetailRecord {
  return (
    fakeTeacherDetails[teacherId] ?? {
      ...fakeTeacherDetails["1"],
      teacherId,
      teacherName: `教师 ${teacherId}`,
    }
  );
}

export async function getTeacherDetail(teacherId: string): Promise<TeacherDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = getTeacherSource(teacherId);

  return {
    ...detail,
    initialReviews: getReviewPageFromList(detail.reviews, null, DEFAULT_REVIEW_PAGE_SIZE),
    initialHistoryScores: getHistoryPageFromList(
      buildHistorySource(detail.teacherId, "semester"),
      null,
      DEFAULT_HISTORY_PAGE_SIZE,
    ),
  };
}

export async function getTeacherReviewsPage(
  teacherId: string,
  cursor: string | null,
  limit?: number,
): Promise<ReviewPageResult> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = getTeacherSource(teacherId);
  return getReviewPageFromList(detail.reviews, cursor, limit);
}

export async function getTeacherScoreHistoryPage(
  teacherId: string,
  granularity: ScoreHistoryGranularity,
  cursor: string | null,
  limit?: number,
): Promise<HistoryScorePageResult> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const source = buildHistorySource(teacherId, granularity);
  return getHistoryPageFromList(source, cursor, limit);
}

export async function getTeacherTopReviews(teacherId: string): Promise<ReviewItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = getTeacherSource(teacherId);
  return detail.topReviews.map((item) => ({
    ...item,
    sourceTeacherId: item.sourceTeacherId ?? detail.teacherId,
    sourceTeacherName: item.sourceTeacherName ?? detail.teacherName,
  }));
}
