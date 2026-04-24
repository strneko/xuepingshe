import { CourseDetailData, ResourceItem } from "../_types";
import { getCourseSource } from "./course-detail-source";
import { getCourseReviewsPage, getCourseTopReviews } from "./course-review-data";
import { getCourseScoreHistoryPage } from "./course-history-data";
import { listResourcesByCourseId } from "@/lib/upload/repositories/course-resource-repo";
import { headers } from "next/headers";
import { getSessionUserId } from "@/lib/auth/session";

const DEFAULT_REVIEW_PAGE_SIZE = 10;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extensionToType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "附件";
  if (["pdf", "ppt", "pptx", "doc", "docx", "txt"].includes(ext)) return "讲义";
  if (["mp4", "mov", "mkv"].includes(ext)) return "视频";
  if (["zip", "rar", "7z"].includes(ext)) return "压缩包";
  if (["xlsx", "xls", "csv"].includes(ext)) return "表格";
  return "附件";
}

async function getCourseResources(courseId: string): Promise<ResourceItem[]> {
  const rows = await listResourcesByCourseId(courseId);

  return rows.map((row) => ({
    id: row.id,
    name: row.fileName,
    type: extensionToType(row.fileName),
    updatedAt: formatDate(row.uploadedAt),
  }));
}

export async function getCourseDetail(courseId: string): Promise<CourseDetailData> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const userId = getSessionUserId(await headers());
  const detail = await getCourseSource(courseId);
  const resources = await getCourseResources(courseId);

  return {
    ...detail,
    resources,
    initialReviews: await getCourseReviewsPage(courseId, null, DEFAULT_REVIEW_PAGE_SIZE, userId),
    topReviews: await getCourseTopReviews(courseId, userId),
  };
}

export { getCourseReviewsPage, getCourseTopReviews, getCourseScoreHistoryPage };
