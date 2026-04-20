"use client";

import * as React from "react";
import { toast } from "sonner";

import { CommunityPost } from "@/app/community/_types";
import { useAuthStore } from "@/lib/stores/auth-store";

type UseCommunityPostLikeOptions<T extends CommunityPost | null> = {
  initialPost: T;
  onPostChange?: (post: CommunityPost) => void;
};

export function useCommunityPostLike<T extends CommunityPost | null>({
  initialPost,
  onPostChange,
}: UseCommunityPostLikeOptions<T>) {
  const [post, setPost] = React.useState(initialPost);
  const [liking, setLiking] = React.useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  React.useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const toggleLike = React.useCallback(async () => {
    if (liking || !post) {
      return;
    }

    if (!isLoggedIn) {
      openAuthDialog();
      return;
    }

    const previousPost = post;
    const nextLiked = !previousPost.isLiked;
    const nextLikeCount = Math.max(0, previousPost.likesCount + (nextLiked ? 1 : -1));

    const optimisticPost = {
      ...previousPost,
      isLiked: nextLiked,
      likesCount: nextLikeCount,
    };

    setPost(optimisticPost);
    onPostChange?.(optimisticPost);
    setLiking(true);

    try {
      const response = await fetch(`/api/community/posts/${previousPost.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liked: nextLiked }),
      });

      const data = (await response.json()) as {
        message?: string;
        liked?: boolean;
        likeCount?: number;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "点赞操作失败");
      }

      const confirmedPost = {
        ...previousPost,
        isLiked: Boolean(data.liked),
        likesCount: typeof data.likeCount === "number" ? data.likeCount : nextLikeCount,
      };

      setPost(confirmedPost);
      onPostChange?.(confirmedPost);
    } catch {
      setPost(previousPost);
      onPostChange?.(previousPost);
      toast.error("点赞失败，请稍后重试");
    } finally {
      setLiking(false);
    }
  }, [isLoggedIn, liking, onPostChange, openAuthDialog, post]);

  return {
    post,
    setPost,
    liking,
    toggleLike,
  };
}

type UseCommunityPostsLikeOptions = {
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
};

export function useCommunityPostsLike({ setPosts }: UseCommunityPostsLikeOptions) {
  const [likingPostIds, setLikingPostIds] = React.useState<Set<string>>(new Set());
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openAuthDialog = useAuthStore((state) => state.openAuthDialog);

  const toggleLike = React.useCallback(
    async (postId: string) => {
      if (likingPostIds.has(postId)) {
        return;
      }

      if (!isLoggedIn) {
        openAuthDialog();
        return;
      }

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

      if (!previousPost) {
        return;
      }

      const currentPost = previousPost as CommunityPost;
      const targetLiked = !currentPost.isLiked;

      setLikingPostIds((current) => {
        const next = new Set(current);
        next.add(postId);
        return next;
      });

      try {
        const response = await fetch(`/api/community/posts/${postId}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ liked: targetLiked }),
        });

        const data = (await response.json()) as {
          message?: string;
          liked?: boolean;
          likeCount?: number;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "点赞操作失败");
        }

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
      } catch {
        setPosts((current) => current.map((post) => (post.id === postId && previousPost ? previousPost : post)));
        toast.error("点赞失败，请稍后重试");
      } finally {
        setLikingPostIds((current) => {
          const next = new Set(current);
          next.delete(postId);
          return next;
        });
      }
    },
    [isLoggedIn, likingPostIds, openAuthDialog, setPosts],
  );

  return {
    likingPostIds,
    toggleLike,
  };
}
