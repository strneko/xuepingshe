import { DimensionScore, HistoryScorePageResult, ReviewItem, ReviewPageResult } from "../../course/[courseId]/_types";

export interface TeacherDetailData {
  teacherId: string;
  teacherName: string;
  avatarUrl?: string;
  department: string;
  title: string;
  researchAreas: string[];
  office: string;
  description: string;
  recentOverallScore: number;
  recentSevenScores: DimensionScore[];
  initialReviews: ReviewPageResult;
  topReviews: ReviewItem[];
  initialHistoryScores: HistoryScorePageResult;
}
