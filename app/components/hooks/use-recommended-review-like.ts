"use client";

import * as React from "react";

import { ReviewItem } from "@/app/course/[courseId]/_types";
import { useLikeAction } from "@/app/hooks/use-like-action";

type UseRecommendedReviewLikeOptions = {
  setReviews: React.Dispatch<React.SetStateAction<ReviewItem[]>>;
};

export function useRecommendedReviewLike({ setReviews }: UseRecommendedReviewLikeOptions) {
  const { likingId, runLikeAction } = useLikeAction({ mode: "global" });

  const toggleLike = React.useCallback(
    async (review: ReviewItem) => {
      await runLikeAction(review.id, {
        optimistic: () => {
          const nextLiked = !review.liked;

          setReviews((current) =>
            current.map((item) =>
              item.id === review.id
                ? {
                    ...item,
                    liked: nextLiked,
                    likesCount: Math.max(0, item.likesCount + (nextLiked ? 1 : -1)),
                  }
                : item,
            ),
          );

          return review;
        },
        request: async () => {
          const response = await fetch(`/api/reviews/recommended/${review.id}/like`, {
            method: "POST",
          });

          const data = (await response.json()) as {
            message?: string;
            reviewId?: string;
            likesCount?: number;
            liked?: boolean;
          };

          if (!response.ok || !data.reviewId) {
            throw new Error(data.message ?? "点赞失败");
          }

          return data;
        },
        confirm: (data) => {
          setReviews((current) =>
            current.map((item) =>
              item.id === data.reviewId
                ? {
                    ...item,
                    liked: Boolean(data.liked),
                    likesCount: typeof data.likesCount === "number" ? data.likesCount : item.likesCount,
                  }
                : item,
            ),
          );
        },
        rollback: (previousReview) => {
          setReviews((current) =>
            current.map((item) =>
              item.id === previousReview.id
                ? {
                    ...item,
                    liked: previousReview.liked ?? false,
                    likesCount: previousReview.likesCount,
                  }
                : item,
            ),
          );
        },
      });
    },
    [runLikeAction, setReviews],
  );

  return {
    likingReviewId: likingId,
    toggleLike,
  };
}
