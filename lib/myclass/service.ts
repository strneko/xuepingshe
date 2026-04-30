import { prisma } from "@/lib/prisma";

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

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      name: true,
    },
  });

  if (currentUser?.role === "TEACHER") {
    const teacherName = currentUser.name?.trim() || "";

    if (!teacherName) {
      return {
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 1,
      };
    }

    const offerings = await prisma.courseOffering.findMany({
      where: {
        teacherName,
      },
      select: {
        id: true,
        courseId: true,
        courseName: true,
        teacherName: true,
        semesterKey: true,
        status: true,
        endAt: true,
        createdAt: true,
        inviteCode: {
          select: {
            code: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const courseIds = Array.from(new Set(offerings.map((item) => item.courseId)));

    const [profiles, scoreGroups] = await Promise.all([
      prisma.courseProfile.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
        },
        select: {
          courseId: true,
          intro: true,
          location: true,
          schedule: true,
        },
      }),
      prisma.courseReview.groupBy({
        by: ["courseId"],
        where: {
          courseId: {
            in: courseIds,
          },
          status: "VISIBLE",
        },
        _avg: {
          overallScore: true,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const offeringIds = offerings.map((o) => o.id);
    const now = new Date();
    const teacherActiveRounds = offeringIds.length > 0
      ? await prisma.reviewRound.findMany({
          where: {
            offeringId: { in: offeringIds },
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
          select: { id: true, offeringId: true, endsAt: true },
        })
      : [];

    const roundDeadlineByOffering = new Map(
      teacherActiveRounds.map((r) => [r.offeringId, r.endsAt.toISOString()]),
    );
    const activeRoundIdByTeacherOffering = new Map(
      teacherActiveRounds.map((r) => [r.offeringId, r.id]),
    );

    const profileMap = new Map(
      profiles.map((item) => [
        item.courseId,
        {
          intro: item.intro,
          location: item.location,
          schedule: item.schedule,
        },
      ]),
    );

    const scoreMap = new Map(
      scoreGroups.map((item) => [
        item.courseId,
        {
          score: typeof item._avg.overallScore === "number" ? Number(item._avg.overallScore.toFixed(1)) : null,
          reviewCount: item._count._all,
        },
      ]),
    );

    let items: MyClassCourseItem[] = offerings.map((item) => {
      const profile = profileMap.get(item.courseId);
      const score = scoreMap.get(item.courseId);
      const fallbackDeadline = new Date(item.createdAt.getTime() + 120 * 24 * 60 * 60 * 1000);

      return {
        enrollmentId: item.id,
        offeringId: item.id,
        courseId: item.courseId,
        courseName: item.courseName,
        viewerRole: "TEACHER",
        teacher: item.teacherName,
        term: item.semesterKey,
        offeringStatus: item.status,
        location: profile?.location?.trim() || "待补充",
        time: profile?.schedule?.trim() || "待补充",
        imageUrl: "#",
        deadline: roundDeadlineByOffering.get(item.id)
          ? formatDeadline(new Date(roundDeadlineByOffering.get(item.id)!))
          : (item.endAt ? formatDeadline(item.endAt) : formatDeadline(fallbackDeadline)),
        isEvaluated: false,
        description: profile?.intro?.trim() || "课程信息待补充",
        credits: "-",
        inviteCode: item.inviteCode?.isActive ? item.inviteCode.code : null,
        recentScore: score?.score ?? null,
        reviewCount: score?.reviewCount ?? 0,
        activeRoundId: activeRoundIdByTeacherOffering.get(item.id) ?? null,
      };
    });

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

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
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
      offering: {
        select: {
          status: true,
          semesterKey: true,
          endAt: true,
        },
      },
    },
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
  });

  // Determine which courses have been evaluated in the current active round
  const offeringIds = enrollments.map((e) => e.offeringId);
  const now = new Date();
  const activeRounds = offeringIds.length > 0
    ? await prisma.reviewRound.findMany({
        where: {
          offeringId: { in: offeringIds },
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        select: {
          id: true,
          courseId: true,
          offeringId: true,
          endsAt: true,
        },
      })
    : [];

  const activeRoundIds = activeRounds.map((r) => r.id);
  // offeringId → active round deadline
  const activeRoundDeadlineByOffering = new Map(
    activeRounds.map((r) => [r.offeringId, r.endsAt.toISOString()]),
  );
  // offeringId → active round id
  const activeRoundIdByOffering = new Map(
    activeRounds.map((r) => [r.offeringId, r.id]),
  );

  const userActiveReviews = activeRoundIds.length > 0
    ? await prisma.courseReview.findMany({
        where: {
          userId,
          roundId: { in: activeRoundIds },
        },
        select: {
          courseId: true,
          roundId: true,
        },
      })
    : [];

  // courseIds where user has reviewed the active round
  const evaluatedCourseIds = new Set(userActiveReviews.map((r) => r.courseId));
  // courseIds that currently have an active review round
  const coursesWithActiveRound = new Set(activeRounds.map((r) => r.courseId));

  let items: MyClassCourseItem[] = enrollments.map((item) => ({
    enrollmentId: item.id,
    offeringId: item.offeringId,
    courseId: item.courseId,
    courseName: item.courseName,
    viewerRole: "STUDENT",
    teacher: item.teacherName?.trim() || "待完善",
    term: item.term?.trim() || item.offering.semesterKey,
    offeringStatus: item.offering.status,
    location: item.location?.trim() || "待同步",
    time: item.classTime?.trim() || "待教务系统同步",
    imageUrl: "#",
    deadline: activeRoundDeadlineByOffering.get(item.offeringId)
      ? formatDeadline(new Date(activeRoundDeadlineByOffering.get(item.offeringId)!))
      : (item.offering.endAt ? formatDeadline(item.offering.endAt) : buildDeadline(item.enrolledAt)),
    isEvaluated: evaluatedCourseIds.has(item.courseId),
    description: "课程信息来自已加入课程",
    credits: formatCredits(item.credits as unknown),
    inviteCode: null,
    recentScore: null,
    reviewCount: 0,
    activeRoundId: activeRoundIdByOffering.get(item.offeringId) ?? null,
  }));

  if (onlyUnevaluated) {
    items = items.filter(
      (item) => coursesWithActiveRound.has(item.courseId) && !item.isEvaluated,
    );
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
