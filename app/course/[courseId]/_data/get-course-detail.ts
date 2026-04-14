import { CourseDetailData } from "../_types";
import { getCourseSource } from "./course-detail-source";
import { getCourseReviewsPage, getCourseTopReviews } from "./course-review-data";

const DEFAULT_REVIEW_PAGE_SIZE = 10;

export async function getCourseDetail(courseId: string): Promise<CourseDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const detail = getCourseSource(courseId);

  return {
    ...detail,
    initialReviews: await getCourseReviewsPage(courseId, null, DEFAULT_REVIEW_PAGE_SIZE),
    topReviews: await getCourseTopReviews(courseId),
  };
}
