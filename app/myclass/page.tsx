import CoursesList from "./components/courses-list";
import Filter from "./components/filter";
import Pagination from "@/components/pagination";
import { getMyClassCourses } from "@/lib/myclass/service";
import { getSemesterSequence, getCurrentSemesterKey } from "@/lib/course-offerings";
import { headers } from "next/headers";
import { getSessionUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

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
    semester?: string;
  }>;
}

export default async function MyClassPage({ searchParams }: MyClassPageProps) {
  const params = await searchParams;
  const headerStore = await headers();
  const userId = getSessionUserId(headerStore);
  const adminUser = isAdmin(userId);
  const semesterKey = params.semester?.trim() || undefined;

  const [coursesResult, semesterSequence, currentSemesterKey] = await Promise.all([
    getMyClassCourses({
      userId,
      unevaluated: params.unevaluated === "true",
      sort: params.sort === "desc" ? "desc" : "asc",
      keyword: params.keyword,
      page: Number(params.page ?? "1"),
      pageSize: 10,
      admin: adminUser,
      semesterKey,
    }),
    adminUser ? getSemesterSequence() : Promise.resolve([]),
    adminUser ? getCurrentSemesterKey() : Promise.resolve(""),
  ]);

  const {
    items: courses,
    currentPage,
    totalPages,
  } = coursesResult;
  const keyword = params.keyword?.trim() ?? "";

  return (
    <div>
      <Filter
        isAdmin={adminUser}
        semesterSequence={semesterSequence}
        currentSemesterKey={currentSemesterKey}
      />
      <CoursesList courses={courses} keyword={keyword} isAdmin={adminUser} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
