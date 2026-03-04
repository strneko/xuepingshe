import { Suspense } from "react";
import CoursesList from "./components/courses-list";
import Filter from "./components/filter";
import Pagination from "@/components/pagination";
import { Loader2 } from "lucide-react";

export interface CourseCardProps {
  courseId: number;
  courseName: string;
  teacher: string;
  location: string;
  time: string;
  imageUrl: string;
  deadline: string;
  isEvaluated: boolean;
  onEvaluate?: () => void;
  // ✨ 新增：允许传递更多详情数据（可选）
  description?: string;
  credits?: string;
}

interface MyClassPageProps {
  searchParams: {
    unevaluated?: "true" | "false";
    sort?: "asc" | "desc";
    keyword?: string;
    page?: string;
  };
}
// 模拟从数据库获取数据的函数
async function getCourses(searchParams: {
  unevaluated?: "true" | "false";
  sort?: "asc" | "desc";
  keyword?: string;
  page?: string;
}) {
  // 执行 SQL: SELECT * FROM courses WHERE ... ORDER BY ...
  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allCourses = [
    {
      courseId: 1,
      courseName: "高等数学",
      deadline: "2026-03-15",
      isEvaluated: false,
      teacher: "张教授",
      location: "A-101",
      time: "周一 08:00",
      imageUrl: "#",
      description: "微积分",
      credits: "4.0",
    },
    {
      courseId: 2,
      courseName: "计算机基础",
      deadline: "2026-03-05",
      isEvaluated: true,
      teacher: "李老师",
      location: "305",
      time: "周三 14:00",
      imageUrl: "#",
      description: "入门",
      credits: "2.0",
    },
    {
      courseId: 3,
      courseName: "大学英语",
      deadline: "2026-03-10",
      isEvaluated: false,
      teacher: "王老师",
      location: "202",
      time: "周五 10:00",
      imageUrl: "#",
      description: "英语",
      credits: "3.0",
    },
    {
      courseId: 4,
      courseName: "体育篮球",
      deadline: "2026-03-02",
      isEvaluated: false,
      teacher: "陈教练",
      location: "体育馆",
      time: "周四 15:00",
      imageUrl: "#",
      description: "篮球",
      credits: "1.0",
    },
  ];

  let result = [...allCourses];

  // 服务端过滤
  if (searchParams.unevaluated === "true") {
    result = result.filter((c) => !c.isEvaluated);
  }

  if (searchParams.keyword?.trim()) {
    const normalizedKeyword = searchParams.keyword.trim().toLowerCase();
    result = result.filter((c) => c.courseName.toLowerCase().includes(normalizedKeyword));
  }

  // 服务端排序
  const sortOrder = searchParams.sort === "desc" ? -1 : 1; // asc=default
  result.sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return (dateA - dateB) * sortOrder;
  });

  const pageSize = 2; //Consider making this a configurable constant or parameter to improve maintainability and allow easier adjustments.

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rawPage = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), totalPages) : 1;
  const start = (currentPage - 1) * pageSize;
  const pagedCourses = result.slice(start, start + pageSize);

  return {
    courses: pagedCourses,
    currentPage,
    totalPages,
  };
}

export default async function MyClassPage({ searchParams }: MyClassPageProps) {
  const params = await searchParams;
  const { courses, currentPage, totalPages } = await getCourses(params);
  return (
    <div>
      <Filter />
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" /> 加载中...
          </div>
        }
      >
        <CoursesList courses={courses} />
      </Suspense>
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
