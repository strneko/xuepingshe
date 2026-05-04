import { cache } from "react";
import { prisma } from "@/lib/prisma";

import type { UserProfile } from "@/lib/stores/auth-store";

export const buildUserProfile = cache(async (userId: string): Promise<UserProfile | null> => {
  const [user, likedSummary, followingCount, followerCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
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
    prisma.follow.count({
      where: {
        followerId: userId,
      },
    }),
    prisma.follow.count({
      where: {
        followingId: userId,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nickname: user.name ?? "匿名同学",
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    reviewCount: (user._count.courseReviews ?? 0) + (user._count.teacherReviews ?? 0),
    likedCount: likedSummary._sum.likeCount ?? 0,
    followingCount,
    followerCount,
    points: user.points,
  };
});
