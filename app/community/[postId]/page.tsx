import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { resolveCurrentUserId, stripHtml } from "@/lib/community/shared";
import type { UserProfile } from "@/lib/stores/auth-store";
import CommunityPostDetailShell from "../components/community-post-detail-shell";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export default async function CommunityPostPage({ params }: PageProps) {
  const { postId } = await params;
  const headerStore = await headers();
  const userId = await resolveCurrentUserId(headerStore.get("x-user-id"));

  const [post, comments] = await prisma.$transaction([
    prisma.communityPost.findFirst({
      where: {
        id: postId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        contentHtml: true,
        createdAt: true,
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
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
          take: 1,
        },
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

  const likedSummary = await prisma.communityPost.aggregate({
    where: {
      authorId: post.author.id,
      status: "PUBLISHED",
    },
    _sum: {
      likeCount: true,
    },
  });

  const normalizedPost = {
    id: post.id,
    title: post.title,
    author: {
      nickname: post.author.name ?? "匿名同学",
      avatarUrl: "",
    },
    createdAt: post.createdAt.toISOString(),
    lastReplyAt: post.lastReplyAt?.toISOString(),
    content: stripHtml(post.contentHtml),
    images: [],
    tags: post.topics.map((item) => item.topic.name),
    likesCount: post.likeCount,
    isLiked: post.likes.length > 0,
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
      />
    </main>
  );
}
