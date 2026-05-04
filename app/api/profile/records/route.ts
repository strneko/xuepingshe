import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { countBrowseHistory, listBrowseHistoryPaged } from "@/lib/profile/browse-history";

const PAGE_SIZE_DEFAULT = 5;
const PAGE_SIZE_MAX = 20;

const VALID_TABS = new Set(["view", "review", "post", "comment", "liked", "following", "followers"]);

type UserRecordTab = "view" | "review" | "post" | "comment" | "liked" | "following" | "followers";

type BrowseRecord = {
  id: string;
  title: string;
  href: string;
  kind: "COURSE" | "TEACHER" | "COMMUNITY_POST";
  visitedAt: string;
};

type ReviewRecord = {
  id: string;
  reviewType: "COURSE" | "TEACHER";
  courseName: string;
  teacherName?: string;
  score: string;
  reviewedAt: string;
  href: string;
};

type PostRecord = {
  id: string;
  title: string;
  liked: number;
  commentCount: number;
  postedAt: string;
  href: string;
};

type CommentRecord = {
  id: string;
  title: string;
  content: string;
  commentAt: string;
  href: string;
};

type LikedRecord = {
  id: string;
  title: string;
  author: string;
  likedAt: string;
  href: string;
};

type FollowRecord = {
  id: string;
  name: string;
  department: string;
  followedAt: string;
};

type FollowerRecord = {
  id: string;
  name: string;
  introduction: string;
  followedAt: string;
};

type HistoryItem =
  | BrowseRecord
  | ReviewRecord
  | PostRecord
  | CommentRecord
  | LikedRecord
  | FollowRecord
  | FollowerRecord;

type CourseReviewRow = {
  id: string;
  courseId: string;
  overallScore: number | null;
  createdAt: Date;
};

type TeacherReviewRow = {
  id: string;
  teacherId: string;
  sourceCourseName: string | null;
  overallScore: number | null;
  createdAt: Date;
};

type PostRow = {
  id: string;
  title: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
};

type CommentRow = {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  post: {
    title: string;
  };
};

type LikeRow = {
  id: string;
  createdAt: Date;
  post: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string | null;
    };
  };
};

type FollowingRow = {
  createdAt: Date;
  following: {
    id: string;
    name: string | null;
    role: "STUDENT" | "TEACHER";
    teacherProfile: {
      department: string | null;
    } | null;
  };
};

type FollowerRow = {
  createdAt: Date;
  follower: {
    id: string;
    name: string | null;
    role: "STUDENT" | "TEACHER";
    teacherProfile: {
      department: string | null;
    } | null;
  };
};

function parseTab(raw: string | null): UserRecordTab {
  const value = raw ?? "view";
  if (!VALID_TABS.has(value)) {
    return "view";
  }
  return value as UserRecordTab;
}

function parsePage(raw: string | null) {
  const value = Number(raw ?? "1");
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.trunc(value);
}

function parsePageSize(raw: string | null) {
  const value = Number(raw ?? PAGE_SIZE_DEFAULT);
  if (!Number.isFinite(value) || value <= 0) {
    return PAGE_SIZE_DEFAULT;
  }
  return Math.min(Math.trunc(value), PAGE_SIZE_MAX);
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatUserBadge(input: { role: "STUDENT" | "TEACHER"; department?: string | null }) {
  if (input.role === "TEACHER") {
    return input.department?.trim() || "教师";
  }
  return "学生";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request.headers);
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = parseTab(searchParams.get("tab"));
    const page = parsePage(searchParams.get("page"));
    const pageSize = parsePageSize(searchParams.get("pageSize"));
    const offset = (page - 1) * pageSize;

    if (tab === "view") {
      const [total, rows] = await Promise.all([
        countBrowseHistory(userId),
        listBrowseHistoryPaged(userId, offset, pageSize),
      ]);

      const items: BrowseRecord[] = rows.map((item) => ({
        id: item.id,
        title: item.title,
        href: item.href,
        kind: item.kind,
        visitedAt: formatDate(item.visitedAt),
      }));

      return NextResponse.json({ tab, page, pageSize, total, items });
    }

    if (tab === "review") {
      const take = offset + pageSize;
      const [courseReviews, teacherReviews, courseTotal, teacherTotal] = await Promise.all([
        prisma.courseReview.findMany({
          where: { userId, status: "VISIBLE" },
          select: {
            id: true,
            courseId: true,
            overallScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
        prisma.teacherReview.findMany({
          where: { userId, status: "VISIBLE" },
          select: {
            id: true,
            teacherId: true,
            sourceCourseName: true,
            overallScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take,
        }),
        prisma.courseReview.count({ where: { userId, status: "VISIBLE" } }),
        prisma.teacherReview.count({ where: { userId, status: "VISIBLE" } }),
      ]);

      const [courseProfiles, teacherProfiles] = await Promise.all([
        prisma.courseProfile.findMany({
          where: {
            courseId: {
              in: Array.from(new Set(courseReviews.map((item) => item.courseId))),
            },
          },
          select: {
            courseId: true,
            courseName: true,
            teacherName: true,
          },
        }),
        prisma.teacherProfile.findMany({
          where: {
            teacherId: {
              in: Array.from(new Set(teacherReviews.map((item) => item.teacherId))),
            },
          },
          select: {
            teacherId: true,
            teacherName: true,
          },
        }),
      ]);

      const courseMetaMap = new Map(
        courseProfiles.map((item) => [item.courseId, { courseName: item.courseName, teacherName: item.teacherName }]),
      );
      const teacherNameMap = new Map(teacherProfiles.map((item) => [item.teacherId, item.teacherName]));

      const combined = [
        ...courseReviews.map((item: CourseReviewRow) => ({
          createdAt: item.createdAt,
          record: {
            id: `course-${item.id}`,
            reviewType: "COURSE" as const,
            courseName: courseMetaMap.get(item.courseId)?.courseName ?? `课程 ${item.courseId}`,
            teacherName: courseMetaMap.get(item.courseId)?.teacherName,
            score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
            reviewedAt: formatDate(item.createdAt),
            href: `/course/${item.courseId}?tab=history`,
          },
        })),
        ...teacherReviews.map((item: TeacherReviewRow) => ({
          createdAt: item.createdAt,
          record: {
            id: `teacher-${item.id}`,
            reviewType: "TEACHER" as const,
            courseName: item.sourceCourseName?.trim() || "教师评价",
            teacherName: teacherNameMap.get(item.teacherId) ?? `教师 ${item.teacherId}`,
            score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
            reviewedAt: formatDate(item.createdAt),
            href: `/teacher/${item.teacherId}?tab=history`,
          },
        })),
      ]
        .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
        .slice(offset, offset + pageSize)
        .map((item) => item.record as ReviewRecord);

      return NextResponse.json({
        tab,
        page,
        pageSize,
        total: courseTotal + teacherTotal,
        items: combined,
      });
    }

    if (tab === "post") {
      const [rows, total] = await Promise.all([
        prisma.communityPost.findMany({
          where: { authorId: userId, status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            likeCount: true,
            commentCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: pageSize,
        }),
        prisma.communityPost.count({
          where: { authorId: userId, status: "PUBLISHED" },
        }),
      ]);

      const items: PostRecord[] = rows.map((item: PostRow) => ({
        id: item.id,
        title: item.title,
        liked: item.likeCount,
        commentCount: item.commentCount,
        postedAt: formatDate(item.createdAt),
        href: `/community/${item.id}`,
      }));

      return NextResponse.json({ tab, page, pageSize, total, items });
    }

    if (tab === "comment") {
      const [rows, total] = await Promise.all([
        prisma.communityPostComment.findMany({
          where: { authorId: userId, status: "VISIBLE" },
          select: {
            id: true,
            postId: true,
            content: true,
            createdAt: true,
            post: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: pageSize,
        }),
        prisma.communityPostComment.count({
          where: { authorId: userId, status: "VISIBLE" },
        }),
      ]);

      const items: CommentRecord[] = rows.map((item: CommentRow) => ({
        id: item.id,
        title: item.post.title,
        content: item.content,
        commentAt: formatDate(item.createdAt),
        href: `/community/${item.postId}`,
      }));

      return NextResponse.json({ tab, page, pageSize, total, items });
    }

    if (tab === "liked") {
      const [rows, total] = await Promise.all([
        prisma.communityPostLike.findMany({
          where: {
            userId,
            post: {
              status: "PUBLISHED",
            },
          },
          select: {
            id: true,
            createdAt: true,
            post: {
              select: {
                id: true,
                title: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: pageSize,
        }),
        prisma.communityPostLike.count({
          where: {
            userId,
            post: {
              status: "PUBLISHED",
            },
          },
        }),
      ]);

      const items: LikedRecord[] = rows.map((item: LikeRow) => ({
        id: item.id,
        title: item.post.title,
        author: item.post.author.name?.trim() || "匿名用户",
        likedAt: formatDate(item.createdAt),
        href: `/community/${item.post.id}`,
      }));

      return NextResponse.json({ tab, page, pageSize, total, items });
    }

    if (tab === "following") {
      const [rows, total] = await Promise.all([
        prisma.follow.findMany({
          where: {
            followerId: userId,
          },
          select: {
            createdAt: true,
            following: {
              select: {
                id: true,
                name: true,
                role: true,
                teacherProfile: {
                  select: {
                    department: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: pageSize,
        }),
        prisma.follow.count({
          where: {
            followerId: userId,
          },
        }),
      ]);

      const items: FollowRecord[] = (rows as FollowingRow[]).map((item) => ({
        id: item.following.id,
        name: item.following.name ?? "匿名用户",
        department: formatUserBadge({
          role: item.following.role,
          department: item.following.teacherProfile?.department,
        }),
        followedAt: formatDate(item.createdAt),
      }));

      return NextResponse.json({ tab, page, pageSize, total, items });
    }

    const [rows, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        select: {
          createdAt: true,
          follower: {
            select: {
              id: true,
              name: true,
              role: true,
              teacherProfile: {
                select: {
                  department: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: pageSize,
      }),
      prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
    ]);

    const items: FollowerRecord[] = (rows as FollowerRow[]).map((item) => ({
      id: item.follower.id,
      name: item.follower.name ?? "匿名用户",
      introduction: formatUserBadge({
        role: item.follower.role,
        department: item.follower.teacherProfile?.department,
      }),
      followedAt: formatDate(item.createdAt),
    }));

    return NextResponse.json({ tab, page, pageSize, total, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取个人中心数据失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
