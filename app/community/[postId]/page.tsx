import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { resolveOptionalCurrentUserId, stripHtml } from "@/lib/community/shared";
import type { UserProfile } from "@/lib/stores/auth-store";
import CommunityPostDetailShell from "../components/community-post-detail-shell";
import { recordBrowseHistory } from "@/lib/profile/browse-history";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export default async function CommunityPostPage({ params }: PageProps) {
  const { postId } = await params;
  const headerStore = await headers();
  const userId = await resolveOptionalCurrentUserId(headerStore);

  const [post, comments] = await prisma.$transaction([
    prisma.communityPost.findFirst({
      where: {
        id: postId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        contentHtml: true,
        createdAt: true,
        updatedAt: true,
        lastReplyAt: true,
        likeCount: true,
        commentCount: true,
        hotScore: true,
        author: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                courseReviews: true,
                teacherReviews: true,
              },
            },
          },
        },
        topics: {
          select: {
            topic: {
              select: {
                name: true,
              },
            },
          },
        },
        ...(userId
          ? {
              likes: {
                where: {
                  userId,
                },
                select: {
                  id: true,
                },
                take: 1,
              },
            }
          : {}),
      },
    }),
    prisma.communityPostComment.findMany({
      where: {
        postId,
        status: "VISIBLE",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100,
      select: {
        id: true,
        content: true,
        replyToCommentId: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  if (!post) {
    notFound();
  }

  if (userId) {
    await recordBrowseHistory({
      userId,
      kind: "COMMUNITY_POST",
      targetId: post.id,
      title: post.title,
      href: `/community/${post.id}`,
    });
  }

  const [likedSummary, followingLikes, followerLikes] = await Promise.all([
    prisma.communityPost.aggregate({
      where: {
        authorId: post.author.id,
        status: "PUBLISHED",
      },
      _sum: {
        likeCount: true,
      },
    }),
    prisma.communityPostLike.findMany({
      where: {
        userId: post.author.id,
        post: {
          status: "PUBLISHED",
        },
      },
      select: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
      take: 1000,
    }),
    prisma.communityPostLike.findMany({
      where: {
        post: {
          authorId: post.author.id,
          status: "PUBLISHED",
        },
      },
      select: {
        userId: true,
      },
      take: 2000,
    }),
  ]);

  const followingCount = new Set(
    followingLikes.map((item) => item.post.authorId).filter((authorId) => authorId && authorId !== post.author.id),
  ).size;
  const followerCount = new Set(
    followerLikes
      .map((item) => item.userId)
      .filter((followerUserId) => followerUserId && followerUserId !== post.author.id),
  ).size;

  const normalizedPost = {
    id: post.id,
    title: post.title,
    authorId: post.author.id,
    contentHtml: post.contentHtml,
    author: {
      nickname: post.author.name ?? "匿名同学",
      avatarUrl: "",
    },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString(),
    content: stripHtml(post.contentHtml),
    images: [],
    tags: post.topics.map((item) => item.topic.name),
    likesCount: post.likeCount,
    isLiked: Boolean(post.likes?.length),
    commentsCount: post.commentCount,
    hotScore: post.hotScore,
  };

  const authorProfile: UserProfile = {
    id: post.author.id,
    nickname: post.author.name ?? "匿名同学",
    avatarUrl: "",
    reviewCount: (post.author._count.courseReviews ?? 0) + (post.author._count.teacherReviews ?? 0),
    likedCount: likedSummary._sum.likeCount ?? 0,
    points: 0,
  };

  return (
    <main className="mx-auto max-w-350 px-[6vw] py-8">
      <CommunityPostDetailShell
        post={normalizedPost}
        comments={comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          replyToCommentId: comment.replyToCommentId,
          createdAt: comment.createdAt.toISOString(),
          author: {
            nickname: comment.author.name ?? "匿名同学",
            avatarUrl: "",
          },
        }))}
        authorProfile={authorProfile}
        followingCount={followingCount}
        followerCount={followerCount}
      />
    </main>
  );
}
