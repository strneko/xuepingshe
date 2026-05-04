import CoursesList from "./components/courses-list";
import Filter from "./components/filter";
import Pagination from "@/components/pagination";
import { getMyClassCourses } from "@/lib/myclass/service";
import { headers } from "next/headers";
import { getSessionUserId } from "@/lib/auth/session";

export interface CourseCardProps {
  enrollmentId: string;
  offeringId: string;
  courseId: string;
  courseName: string;
  viewerRole?: "STUDENT" | "TEACHER";
  teacher: string;
  term: string;
  offeringStatus: "OPEN" | "CLOSED";
  location: string;
  time: string;
  imageUrl: string;
  deadline: string;
  isEvaluated: boolean;
  onEvaluate?: () => void;
  // ✨ 新增：允许传递更多详情数据（可选）
  description?: string;
  credits?: string;
  inviteCode?: string | null;
  recentScore?: number | null;
  reviewCount?: number;
  activeRoundId?: string | null;
}

interface MyClassPageProps {
  searchParams: Promise<{
    unevaluated?: "true" | "false";
    sort?: "asc" | "desc";
    keyword?: string;
    page?: string;
  }>;
}

export default async function MyClassPage({ searchParams }: MyClassPageProps) {
  const params = await searchParams;
  const headerStore = await headers();
  const userId = getSessionUserId(headerStore);
  const {
    items: courses,
    currentPage,
    totalPages,
  } = await getMyClassCourses({
    userId,
    unevaluated: params.unevaluated === "true",
    sort: params.sort === "desc" ? "desc" : "asc",
    keyword: params.keyword,
    page: Number(params.page ?? "1"),
    pageSize: 10,
  });
  const keyword = params.keyword?.trim() ?? "";

  return (
    <div>
      <Filter />
      <CoursesList courses={courses} keyword={keyword} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
