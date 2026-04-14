import { TeacherDetailData } from "../_types";
import { getTeacherReviewsPage, getTeacherTopReviews } from "./teacher-review-data";
import { getTeacherScoreHistoryPage } from "./teacher-history-data";
import { getTeacherSource } from "./teacher-profile-data";

const DEFAULT_REVIEW_PAGE_SIZE = 10;
const DEFAULT_HISTORY_PAGE_SIZE = 12;

export async function getTeacherDetail(teacherId: string): Promise<TeacherDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = await getTeacherSource(teacherId);
  const initialReviews = await getTeacherReviewsPage(teacherId, null, DEFAULT_REVIEW_PAGE_SIZE);
  const initialHistoryScores = await getTeacherScoreHistoryPage(teacherId, "semester", null, DEFAULT_HISTORY_PAGE_SIZE);
  const topReviews = await getTeacherTopReviews(teacherId);

  return {
    ...detail,
    initialReviews,
    topReviews,
    initialHistoryScores,
  };
}

export { getTeacherReviewsPage, getTeacherTopReviews, getTeacherScoreHistoryPage };
