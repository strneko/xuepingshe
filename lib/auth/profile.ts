import { prisma } from "@/lib/prisma";

import type { UserProfile } from "@/lib/stores/auth-store";

export async function buildUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      points: true,
      _count: {
        select: {
          courseReviews: true,
          teacherReviews: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const likedSummary = await prisma.communityPost.aggregate({
    where: {
      authorId: userId,
      status: "PUBLISHED",
    },
    _sum: {
      likeCount: true,
    },
  });

  return {
    id: user.id,
    nickname: user.name ?? "匿名同学",
    avatarUrl: "",
    reviewCount: (user._count.courseReviews ?? 0) + (user._count.teacherReviews ?? 0),
    likedCount: likedSummary._sum.likeCount ?? 0,
    points: user.points,
  };
}
