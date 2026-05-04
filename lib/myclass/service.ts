import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface MyClassCourseItem {
  enrollmentId: string;
  offeringId: string;
  courseId: string;
  courseName: string;
  viewerRole: "STUDENT" | "TEACHER";
  teacher: string;
  term: string;
  offeringStatus: "OPEN" | "CLOSED";
  location: string;
  time: string;
  imageUrl: string;
  deadline: string;
  isEvaluated: boolean;
  description: string;
  credits: string;
  inviteCode?: string | null;
  recentScore?: number | null;
  reviewCount?: number;
  activeRoundId?: string | null;
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

function formatDeadline(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
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

type OfferingRow = {
  id: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  semesterKey: string;
  status: "OPEN" | "CLOSED";
  endAt: Date | null;
  createdAt: Date;
  inviteCode: { code: string; isActive: boolean } | null;
};

type EnrollmentRow = {
  id: string;
  courseId: string;
  courseName: string;
  teacherName: string | null;
  classTime: string | null;
  location: string | null;
  credits: unknown;
  enrolledAt: Date;
  term: string | null;
  offeringId: string;
  offering: {
    status: "OPEN" | "CLOSED";
    semesterKey: string;
    endAt: Date | null;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTeacherItems(params: {
  offerings: OfferingRow[];
  profiles: { courseId: string; intro: string | null; location: string | null; schedule: string | null }[];
  // Prisma groupBy return type is complex; we only access _avg.overallScore and _count._all
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scoreGroups: Record<string, any>[];
  activeRounds: { id: string; offeringId: string; endsAt: Date }[];
}): MyClassCourseItem[] {
  const { offerings, profiles, scoreGroups, activeRounds } = params;

  const profileMap = new Map(
    profiles.map((p) => [p.courseId, { intro: p.intro, location: p.location, schedule: p.schedule }]),
  );
  const scoreMap = new Map(
    scoreGroups.map((s: Record<string, any>) => [
      s.courseId as string,
      {
        score: typeof s._avg?.overallScore === "number" ? Number((s._avg.overallScore as number).toFixed(1)) : null,
        reviewCount: s._count?._all as number ?? 0,
      },
    ]),
  );
  const roundDeadlineByOffering = new Map(activeRounds.map((r) => [r.offeringId, r.endsAt.toISOString()]));
  const activeRoundIdByOffering = new Map(activeRounds.map((r) => [r.offeringId, r.id]));

  return offerings.map((item) => {
    const profile = profileMap.get(item.courseId);
    const score = scoreMap.get(item.courseId);
    const fallbackDeadline = new Date(item.createdAt.getTime() + 120 * 24 * 60 * 60 * 1000);

    return {
      enrollmentId: item.id,
      offeringId: item.id,
      courseId: item.courseId,
      courseName: item.courseName,
      viewerRole: "TEACHER" as const,
      teacher: item.teacherName,
      term: item.semesterKey,
      offeringStatus: item.status,
      location: profile?.location?.trim() || "待补充",
      time: profile?.schedule?.trim() || "待补充",
      imageUrl: "#",
      deadline: roundDeadlineByOffering.get(item.id)
        ? formatDeadline(new Date(roundDeadlineByOffering.get(item.id)!))
        : item.endAt
          ? formatDeadline(item.endAt)
          : formatDeadline(fallbackDeadline),
      isEvaluated: false,
      description: profile?.intro?.trim() || "课程信息待补充",
      credits: "-",
      inviteCode: item.inviteCode?.isActive ? item.inviteCode.code : null,
      recentScore: score?.score ?? null,
      reviewCount: score?.reviewCount ?? 0,
      activeRoundId: activeRoundIdByOffering.get(item.id) ?? null,
    };
  });
}

function buildStudentItems(params: {
  enrollments: EnrollmentRow[];
  activeRounds: { id: string; courseId: string; offeringId: string; endsAt: Date }[];
  userReviews: { courseId: string; roundId: string | null }[];
}): MyClassCourseItem[] {
  const { enrollments, activeRounds, userReviews } = params;

  const roundDeadlineByOffering = new Map(activeRounds.map((r) => [r.offeringId, r.endsAt.toISOString()]));
  const activeRoundIdByOffering = new Map(activeRounds.map((r) => [r.offeringId, r.id]));
  const evaluatedCourseIds = new Set(userReviews.map((r) => r.courseId));
  const coursesWithActiveRound = new Set(activeRounds.map((r) => r.courseId));

  return enrollments.map((item) => ({
    enrollmentId: item.id,
    offeringId: item.offeringId,
    courseId: item.courseId,
    courseName: item.courseName,
    viewerRole: "STUDENT" as const,
    teacher: item.teacherName?.trim() || "待完善",
    term: item.term?.trim() || item.offering.semesterKey,
    offeringStatus: item.offering.status,
    location: item.location?.trim() || "待同步",
    time: item.classTime?.trim() || "待教务系统同步",
    imageUrl: "#",
    deadline: roundDeadlineByOffering.get(item.offeringId)
      ? formatDeadline(new Date(roundDeadlineByOffering.get(item.offeringId)!))
      : item.offering.endAt
        ? formatDeadline(item.offering.endAt)
        : buildDeadline(item.enrolledAt),
    isEvaluated: evaluatedCourseIds.has(item.courseId),
    description: "课程信息来自已加入课程",
    credits: formatCredits(item.credits as unknown),
    inviteCode: null,
    recentScore: null,
    reviewCount: 0,
    activeRoundId: activeRoundIdByOffering.get(item.offeringId) ?? null,
  }));
}

export async function getMyClassCourses(input: GetMyClassCoursesInput): Promise<GetMyClassCoursesResult> {
  const userId = input.userId?.trim() || null;
  const onlyUnevaluated = Boolean(input.unevaluated);
  const sort = normalizeSort(input.sort);
  const keyword = normalizeKeyword(input.keyword);
  const pageSize = normalizePageSize(input.pageSize);

  if (!userId) {
    return { items: [], total: 0, currentPage: 1, totalPages: 1 };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });

  if (currentUser?.role === "TEACHER") {
    return getTeacherCourses({ teacherName: currentUser.name?.trim() || "", keyword, sort, pageSize, page: input.page });
  }

  return getStudentCourses({ userId, keyword, onlyUnevaluated, sort, pageSize, page: input.page });
}

async function getTeacherCourses(params: {
  teacherName: string;
  keyword: string;
  sort: "asc" | "desc";
  pageSize: number;
  page: number | undefined;
}): Promise<GetMyClassCoursesResult> {
  const { teacherName, keyword, sort, pageSize } = params;

  if (!teacherName) {
    return { items: [], total: 0, currentPage: 1, totalPages: 1 };
  }

  const offeringWhere: Prisma.CourseOfferingWhereInput = {
    teacherName,
    ...(keyword
      ? {
          courseName: { contains: keyword, mode: "insensitive" },
        }
      : {}),
  };

  const total = await prisma.courseOffering.count({ where: offeringWhere });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(normalizePage(params.page), totalPages);
  const skip = (currentPage - 1) * pageSize;

  const offerings = await prisma.courseOffering.findMany({
    where: offeringWhere,
    select: {
      id: true,
      courseId: true,
      courseName: true,
      teacherName: true,
      semesterKey: true,
      status: true,
      endAt: true,
      createdAt: true,
      inviteCode: { select: { code: true, isActive: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    skip,
    take: pageSize,
  });

  const courseIds = Array.from(new Set(offerings.map((o) => o.courseId)));
  const offeringIds = offerings.map((o) => o.id);

  const [profiles, scoreGroups, activeRounds] = await Promise.all([
    courseIds.length > 0
      ? prisma.courseProfile.findMany({
          where: { courseId: { in: courseIds } },
          select: { courseId: true, intro: true, location: true, schedule: true },
        })
      : ([] as Awaited<ReturnType<typeof prisma.courseProfile.findMany>>),
    courseIds.length > 0
      ? prisma.courseReview.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds }, status: "VISIBLE" },
          _avg: { overallScore: true },
          _count: { _all: true },
        })
      : ([] as Awaited<ReturnType<typeof prisma.courseReview.groupBy>>),
    offeringIds.length > 0
      ? prisma.reviewRound.findMany({
          where: {
            offeringId: { in: offeringIds },
            startsAt: { lte: new Date() },
            endsAt: { gt: new Date() },
          },
          select: { id: true, offeringId: true, endsAt: true },
        })
      : ([] as { id: string; offeringId: string; endsAt: Date }[]),
  ]);

  let items = buildTeacherItems({ offerings, profiles, scoreGroups, activeRounds });

  items.sort((left, right) => {
    const leftTime = new Date(left.deadline).getTime();
    const rightTime = new Date(right.deadline).getTime();
    return sort === "asc" ? leftTime - rightTime : rightTime - leftTime;
  });

  return { items, total, currentPage, totalPages };
}

async function getStudentCourses(params: {
  userId: string;
  keyword: string;
  onlyUnevaluated: boolean;
  sort: "asc" | "desc";
  pageSize: number;
  page: number | undefined;
}): Promise<GetMyClassCoursesResult> {
  const { userId, keyword, onlyUnevaluated, sort, pageSize } = params;

  const enrollmentWhere: Prisma.EnrollmentWhereInput = {
    userId,
    status: "ACTIVE",
    ...(keyword
      ? {
          OR: [
            { courseName: { contains: keyword, mode: "insensitive" } },
            { teacherName: { contains: keyword, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.enrollment.count({ where: enrollmentWhere });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(normalizePage(params.page), totalPages);
  const skip = (currentPage - 1) * pageSize;

  const enrollments: EnrollmentRow[] = await prisma.enrollment.findMany({
    where: enrollmentWhere,
    select: {
      id: true,
      courseId: true,
      courseName: true,
      teacherName: true,
      classTime: true,
      location: true,
      credits: true,
      enrolledAt: true,
      term: true,
      offeringId: true,
      offering: { select: { status: true, semesterKey: true, endAt: true } },
    },
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: pageSize,
  });

  const offeringIds = enrollments.map((e) => e.offeringId);
  const now = new Date();

  const activeRounds =
    offeringIds.length > 0
      ? await prisma.reviewRound.findMany({
          where: {
            offeringId: { in: offeringIds },
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
          select: { id: true, courseId: true, offeringId: true, endsAt: true },
        })
      : [];

  const activeRoundIds = activeRounds.map((r) => r.id);
  const userReviews =
    activeRoundIds.length > 0
      ? await prisma.courseReview.findMany({
          where: {
            userId,
            roundId: { in: activeRoundIds },
          },
          select: { courseId: true, roundId: true },
        })
      : [];

  let items = buildStudentItems({ enrollments, activeRounds, userReviews });

  if (onlyUnevaluated) {
    const coursesWithActiveRound = new Set(activeRounds.map((r) => r.courseId));
    const evaluatedCourseIds = new Set(userReviews.map((r) => r.courseId));
    items = items.filter((item) => coursesWithActiveRound.has(item.courseId) && !evaluatedCourseIds.has(item.courseId));
  }

  items.sort((left, right) => {
    const leftTime = new Date(left.deadline).getTime();
    const rightTime = new Date(right.deadline).getTime();
    return sort === "asc" ? leftTime - rightTime : rightTime - leftTime;
  });

  return { items, total, currentPage, totalPages };
}
