import { prisma } from "@/lib/prisma";

import type { UserProfile } from "@/lib/stores/auth-store";

export async function buildUserProfile(userId: string): Promise<UserProfile | null> {
  const [user, likedSummary, followingLikes, followerLikes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        points: true,
        _count: {
          select: {
            courseReviews: true,
            teacherReviews: true,
          },
        },
      },
    }),
    prisma.communityPost.aggregate({
      where: {
        authorId: userId,
        status: "PUBLISHED",
      },
      _sum: {
        likeCount: true,
      },
    }),
    prisma.communityPostLike.findMany({
      where: {
        userId,
        post: {
          status: "PUBLISHED",
        },
      },
      select: {
        post: {
          select: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.communityPostLike.findMany({
      where: {
        post: {
          authorId: userId,
          status: "PUBLISHED",
        },
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  const followingCount = new Set(
    followingLikes
      .map((item) => item.post.author)
      .filter((author) => Boolean(author.name?.trim()))
      .map((author) => author.id),
  ).size;

  const followerCount = new Set(followerLikes.map((item) => item.user.id)).size;

  return {
    id: user.id,
    nickname: user.name ?? "匿名同学",
    avatarUrl: "",
    role: user.role,
    reviewCount: (user._count.courseReviews ?? 0) + (user._count.teacherReviews ?? 0),
    likedCount: likedSummary._sum.likeCount ?? 0,
    followingCount,
    followerCount,
    points: user.points,
  };
}
