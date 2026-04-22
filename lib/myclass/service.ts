import { prisma } from "@/lib/prisma";

export interface MyClassCourseItem {
  courseId: string;
  courseName: string;
  teacher: string;
  location: string;
  time: string;
  imageUrl: string;
  deadline: string;
  isEvaluated: boolean;
  description: string;
  credits: string;
}

export interface GetMyClassCoursesInput {
  userId?: string | null;
  unevaluated?: boolean;
  sort?: "asc" | "desc";
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface GetMyClassCoursesResult {
  items: MyClassCourseItem[];
  total: number;
  currentPage: number;
  totalPages: number;
}

function normalizeSort(value: string | undefined) {
  return value === "desc" ? "desc" : "asc";
}

function normalizePage(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1;
  }

  return Math.trunc(value);
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 6;
  }

  return Math.min(20, Math.trunc(value));
}

function normalizeKeyword(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildDeadline(enrolledAt: Date) {
  const deadline = new Date(enrolledAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const year = deadline.getFullYear();
  const month = String(deadline.getMonth() + 1).padStart(2, "0");
  const day = String(deadline.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCredits(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(1);
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(1) : "3.0";
  }

  return "3.0";
}

export async function getMyClassCourses(input: GetMyClassCoursesInput): Promise<GetMyClassCoursesResult> {
  const userId = input.userId?.trim() || null;
  const onlyUnevaluated = Boolean(input.unevaluated);
  const sort = normalizeSort(input.sort);
  const keyword = normalizeKeyword(input.keyword);
  const pageSize = normalizePageSize(input.pageSize);

  if (!userId) {
    return {
      items: [],
      total: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }

  const [enrollments, userCourseReviews] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        courseId: true,
        courseName: true,
        teacherName: true,
        classTime: true,
        location: true,
        credits: true,
        enrolledAt: true,
      },
      orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.courseReview.findMany({
      where: {
        userId,
        status: {
          not: "DELETED",
        },
      },
      select: {
        courseId: true,
      },
    }),
  ]);

  const evaluatedCourseIds = new Set(userCourseReviews.map((item) => item.courseId));

  let items: MyClassCourseItem[] = enrollments.map((item) => ({
    courseId: item.courseId,
    courseName: item.courseName,
    teacher: item.teacherName?.trim() || "待完善",
    location: item.location?.trim() || "待同步",
    time: item.classTime?.trim() || "待教务系统同步",
    imageUrl: "#",
    deadline: buildDeadline(item.enrolledAt),
    isEvaluated: evaluatedCourseIds.has(item.courseId),
    description: "课程信息来自已加入课程",
    credits: formatCredits(item.credits as unknown),
  }));

  if (onlyUnevaluated) {
    items = items.filter((item) => !item.isEvaluated);
  }

  if (keyword) {
    items = items.filter(
      (item) => item.courseName.toLowerCase().includes(keyword) || item.teacher.toLowerCase().includes(keyword),
    );
  }

  items.sort((left, right) => {
    const leftTime = new Date(left.deadline).getTime();
    const rightTime = new Date(right.deadline).getTime();
    return sort === "asc" ? leftTime - rightTime : rightTime - leftTime;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(normalizePage(input.page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    total,
    currentPage,
    totalPages,
  };
}
