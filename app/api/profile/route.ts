import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

type BrowseRecord = {
  id: string;
  courseName: string;
  visitedAt: string;
};

type ReviewRecord = {
  id: string;
  courseName: string;
  score: string;
  reviewedAt: string;
};

type PostRecord = {
  id: string;
  title: string;
  liked: number;
  postedAt: string;
};

type CommentRecord = {
  id: string;
  title: string;
  content: string;
  commentAt: string;
};

type LikedRecord = {
  id: string;
  title: string;
  author: string;
  likedAt: string;
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

    const [courseReviews, teacherReviews, posts, comments, likes, recentNotifications, followerLikeRows] =
      await Promise.all([
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
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.communityPostComment.findMany({
          where: { authorId: userId, status: "VISIBLE" },
          select: {
            id: true,
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
        prisma.userNotification.findMany({
          where: { userId },
          select: {
            id: true,
            createdAt: true,
            notification: {
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
      ]);

    const browseRecords: BrowseRecord[] = recentNotifications.map((item) => ({
      id: item.id,
      courseName: item.notification.title,
      visitedAt: formatDate(item.createdAt),
    }));

    const reviewRecords: ReviewRecord[] = [
      ...courseReviews.map((item) => ({
        id: `course-${item.id}`,
        courseName: `课程 ${item.courseId}`,
        score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
        reviewedAt: formatDate(item.createdAt),
      })),
      ...teacherReviews.map((item) => ({
        id: `teacher-${item.id}`,
        courseName: item.sourceCourseName?.trim() || `教师 ${item.teacherId}`,
        score: item.overallScore !== null ? item.overallScore.toFixed(1) : "-",
        reviewedAt: formatDate(item.createdAt),
      })),
    ]
      .sort((left, right) => (left.reviewedAt < right.reviewedAt ? 1 : -1))
      .slice(0, 200);

    const postRecords: PostRecord[] = posts.map((item) => ({
      id: item.id,
      title: item.title,
      liked: item.likeCount,
      postedAt: formatDate(item.createdAt),
    }));

    const commentRecords: CommentRecord[] = comments.map((item) => ({
      id: item.id,
      title: item.post.title,
      content: item.content,
      commentAt: formatDate(item.createdAt),
    }));

    const likedRecords: LikedRecord[] = likes.map((item) => ({
      id: item.id,
      title: item.post.title,
      author: item.post.author.name?.trim() || "匿名用户",
      likedAt: formatDate(item.createdAt),
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

    likes.forEach((item) => {
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

    followerLikeRows.forEach((item) => {
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
