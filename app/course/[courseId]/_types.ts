export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishAt: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number;
}

export interface ReviewScoreItem {
  key: string;
  label: string;
  score: number | null;
  weight?: number;
  subItems?: ReviewScoreItem[];
}

export interface ReviewItem {
  id: string;
  nickname: string;
  avatarUrl?: string;
  sourceCourseId?: string;
  sourceCourseName?: string;
  sourceTeacherId?: string;
  sourceTeacherName?: string;
  createdAt: string;
  overallScore: number | null;
  likesCount: number;
  liked?: boolean;
  summary: string;
  detailedScores?: ReviewScoreItem[];
}

export interface ReviewPageResult {
  items: ReviewItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export type ScoreHistoryGranularity = "semester" | "year" | "month" | "day";

export interface HistoryScoreItem {
  id: string;
  timeLabel: string;
  overallScore: number | null;
  attitude: number | null;
  content: number | null;
  method: number | null;
  effect: number | null;
  interaction: number | null;
  resource: number | null;
  improve: number | null;
}

export interface HistoryScorePageResult {
  items: HistoryScoreItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface CourseDetailData {
  courseId: string;
  courseName: string;
  teacherId?: string | null;
  teacher: string;
  intro: string;
  location: string;
  time: string;
  recentOverallScore: number;
  recentSevenScores: DimensionScore[];
  announcements: Announcement[];
  resources: ResourceItem[];
  initialReviews: ReviewPageResult;
  topReviews: ReviewItem[];
}
