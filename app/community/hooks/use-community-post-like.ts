"use client";

import * as React from "react";

import { CommunityPost } from "@/app/community/_types";
import { useLikeAction } from "@/app/hooks/use-like-action";

type UseCommunityPostLikeOptions<T extends CommunityPost | null> = {
  initialPost: T;
  onPostChange?: (post: CommunityPost) => void;
};

export function useCommunityPostLike<T extends CommunityPost | null>({
  initialPost,
  onPostChange,
}: UseCommunityPostLikeOptions<T>) {
  const [post, setPost] = React.useState(initialPost);
  const { likingId, runLikeAction } = useLikeAction({ mode: "global" });

  React.useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const toggleLike = React.useCallback(async () => {
    if (!post) {
      return;
    }

    await runLikeAction(post.id, {
      optimistic: () => {
        const nextLiked = !post.isLiked;
        const nextLikeCount = Math.max(0, post.likesCount + (nextLiked ? 1 : -1));
        const optimisticPost = {
          ...post,
          isLiked: nextLiked,
          likesCount: nextLikeCount,
        };

        setPost(optimisticPost);
        onPostChange?.(optimisticPost);
        return post;
      },
      request: async (previousPost) => {
        const response = await fetch(`/api/community/posts/${previousPost.id}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ liked: !previousPost.isLiked }),
        });

        const data = (await response.json()) as {
          message?: string;
          liked?: boolean;
          likeCount?: number;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "点赞操作失败");
        }

        return data;
      },
      confirm: (data, previousPost) => {
        const confirmedPost = {
          ...previousPost,
          isLiked: Boolean(data.liked),
          likesCount: typeof data.likeCount === "number" ? data.likeCount : previousPost.likesCount,
        };

        setPost(confirmedPost);
        onPostChange?.(confirmedPost);
      },
      rollback: (previousPost) => {
        setPost(previousPost);
        onPostChange?.(previousPost);
      },
      errorMessage: "点赞失败，请稍后重试",
    });
  }, [onPostChange, post, runLikeAction]);

  return {
    post,
    setPost,
    liking: Boolean(likingId),
    toggleLike,
  };
}

type UseCommunityPostsLikeOptions = {
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
};

export function useCommunityPostsLike({ setPosts }: UseCommunityPostsLikeOptions) {
  const { pendingIds, runLikeAction } = useLikeAction({ mode: "key" });

  const toggleLike = React.useCallback(
    async (postId: string) => {
      await runLikeAction(postId, {
        optimistic: () => {
          let previousPost: CommunityPost | null = null;

          setPosts((current) =>
            current.map((post) => {
              if (post.id !== postId) {
                return post;
              }

              previousPost = post;
              const nextLiked = !post.isLiked;
              return {
                ...post,
                isLiked: nextLiked,
                likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1)),
              };
            }),
          );

          return previousPost;
        },
        request: async (previousPost) => {
          if (!previousPost) {
            throw new Error("帖子不存在");
          }

          const response = await fetch(`/api/community/posts/${postId}/like`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ liked: !(previousPost as CommunityPost).isLiked }),
          });

          const data = (await response.json()) as {
            message?: string;
            liked?: boolean;
            likeCount?: number;
          };

          if (!response.ok) {
            throw new Error(data.message ?? "点赞操作失败");
          }

          return data;
        },
        confirm: (data) => {
          setPosts((current) =>
            current.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: Boolean(data.liked),
                    likesCount: typeof data.likeCount === "number" ? data.likeCount : post.likesCount,
                  }
                : post,
            ),
          );
        },
        rollback: (previousPost) => {
          if (!previousPost) {
            return;
          }

          setPosts((current) => current.map((post) => (post.id === postId ? previousPost : post)));
        },
        errorMessage: "点赞失败，请稍后重试",
      });
    },
    [runLikeAction, setPosts],
  );

  return {
    likingPostIds: pendingIds,
    toggleLike,
  };
}
