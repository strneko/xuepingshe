import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { BrowseHistoryEntry, listBrowseHistory } from "@/lib/profile/browse-history";

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

type FollowerLikeRow = {
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
  };
};

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const [courseReviews, teacherReviews, posts, comments, likes, browseHistoryRows, followerLikeRows] =
      (await Promise.all([
        prisma.courseReview.findMany({
          where: { userId, status: "VISIBLE" },
          select: {
            id: true,
            courseId: true,
            overallScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
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
          take: 100,
        }),
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
          take: 100,
        }),
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
          take: 100,
        }),
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
          take: 100,
        }),
        listBrowseHistory(userId, 100),
        prisma.communityPostLike.findMany({
          where: {
            post: {
              authorId: userId,
              status: "PUBLISHED",
            },
          },
          select: {
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ])) as [
        CourseReviewRow[],
        TeacherReviewRow[],
        PostRow[],
        CommentRow[],
        LikeRow[],
        BrowseHistoryEntry[],
        FollowerLikeRow[],
      ];

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

    const browseRecords: BrowseRecord[] = browseHistoryRows.map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      kind: item.kind,
      visitedAt: formatDate(item.visitedAt),
    }));

    const reviewRecords: ReviewRecord[] = [
      ...courseReviews.map((item: CourseReviewRow) => ({
        id: `course-${item.id}`,
        reviewType: "COURSE" as const,
        courseName: courseMetaMap.get(item.courseId)?.courseName ?? `课程 ${item.courseId}`,
        teacherName: courseMetaMap.get(item.courseId)?.teacherName,
        score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
        reviewedAt: formatDate(item.createdAt),
        href: `/course/${item.courseId}?tab=history`,
      })),
      ...teacherReviews.map((item: TeacherReviewRow) => ({
        id: `teacher-${item.id}`,
        reviewType: "TEACHER" as const,
        courseName: item.sourceCourseName?.trim() || "教师评价",
        teacherName: teacherNameMap.get(item.teacherId) ?? `教师 ${item.teacherId}`,
        score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
        reviewedAt: formatDate(item.createdAt),
        href: `/teacher/${item.teacherId}?tab=history`,
      })),
    ]
      .sort((left, right) => (left.reviewedAt < right.reviewedAt ? 1 : -1))
      .slice(0, 200);

    const postRecords: PostRecord[] = posts.map((item: PostRow) => ({
      id: item.id,
      title: item.title,
      liked: item.likeCount,
      commentCount: item.commentCount,
      postedAt: formatDate(item.createdAt),
      href: `/community/${item.id}`,
    }));

    const commentRecords: CommentRecord[] = comments.map((item: CommentRow) => ({
      id: item.id,
      title: item.post.title,
      content: item.content,
      commentAt: formatDate(item.createdAt),
      href: `/community/${item.postId}`,
    }));

    const likedRecords: LikedRecord[] = likes.map((item: LikeRow) => ({
      id: item.id,
      title: item.post.title,
      author: item.post.author.name?.trim() || "匿名用户",
      likedAt: formatDate(item.createdAt),
      href: `/community/${item.post.id}`,
    }));

    const followingMap = new Map<
      string,
      {
        id: string;
        name: string;
        department: string;
        followedAt: string;
      }
    >();

    likes.forEach((item: LikeRow) => {
      const authorId = item.post.author.id;
      const authorName = item.post.author.name?.trim();
      if (!authorName) {
        return;
      }

      const key = authorId;
      if (!followingMap.has(key)) {
        followingMap.set(key, {
          id: key,
          name: authorName,
          department: "社区活跃用户",
          followedAt: formatDate(item.createdAt),
        });
      }
    });

    const followingRecords: FollowRecord[] = Array.from(followingMap.values());

    const followerMap = new Map<
      string,
      {
        id: string;
        name: string;
        introduction: string;
        followedAt: string;
        interactionCount: number;
      }
    >();

    followerLikeRows.forEach((item: FollowerLikeRow) => {
      const followerId = item.user.id;
      const followerName = item.user.name?.trim() || "匿名用户";
      const existing = followerMap.get(followerId);

      if (!existing) {
        followerMap.set(followerId, {
          id: followerId,
          name: followerName,
          introduction: "与你有社区互动",
          followedAt: formatDate(item.createdAt),
          interactionCount: 1,
        });
        return;
      }

      existing.interactionCount += 1;
    });

    const followerRecords: FollowerRecord[] = Array.from(followerMap.values()).map((item) => ({
      id: item.id,
      name: item.name,
      introduction: `近期开启了 ${item.interactionCount} 次互动`,
      followedAt: item.followedAt,
    }));

    return NextResponse.json({
      browseRecords,
      reviewRecords,
      postRecords,
      commentRecords,
      likedRecords,
      followingRecords,
      followerRecords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取个人中心数据失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}
