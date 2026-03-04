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
  createdAt: string;
  overallScore: number | null;
  likesCount: number;
  summary: string;
  detailedScores?: ReviewScoreItem[];
}

export interface CourseDetailData {
  courseId: string;
  courseName: string;
  teacher: string;
  intro: string;
  location: string;
  time: string;
  recentOverallScore: number;
  recentSevenScores: DimensionScore[];
  announcements: Announcement[];
  resources: ResourceItem[];
  reviews: ReviewItem[];
  topReviews: ReviewItem[];
}
