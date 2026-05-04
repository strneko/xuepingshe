"use client";
import * as React from "react";
import { ReviewCarousel } from "./review-carousel";
import { ReviewItem } from "../course/[courseId]/_types";
import { useRecommendedReviewLike } from "./hooks/use-recommended-review-like";

export default function Recommendations() {
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [isReviewLoading, setIsReviewLoading] = React.useState(true);
  const { likingReviewId, toggleLike } = useRecommendedReviewLike({ setReviews });

  const fetchReviews = React.useCallback(async () => {
    const response = await fetch("/api/reviews/recommended", { method: "GET" });
    if (!response.ok) {
      throw new Error("加载失败");
    }

    return (await response.json()) as ReviewItem[];
  }, []);

  React.useEffect(() => {
    let isCancelled = false;

    const loadInitialReviews = async () => {
      setIsReviewLoading(true);

      try {
        const data = await fetchReviews();
        if (!isCancelled) {
          setReviews(data);
        }
      } catch {
        if (!isCancelled) {
          setReviews([]);
        }
      } finally {
        if (!isCancelled) {
          setIsReviewLoading(false);
        }
      }
    };

    void loadInitialReviews();

    return () => {
      isCancelled = true;
    };
  }, [fetchReviews]);

  return (
    <div className="flex h-[calc(40vh-64px)] gap-20 justify-between ">
      {isReviewLoading ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">热门评价加载中...</div>
      ) : (
        <ReviewCarousel
          reviews={reviews}
          variant="detailed"
          disabledReviewId={likingReviewId}
          onLikeReview={(review) => void toggleLike(review)}
          showSourceCourse
          showSourceTeacher
          className="mt-4 h-[calc(50vh-64px)] px-10 py-5"
          contentClassName="h-[calc(50vh-64px)]"
          itemClassName="basis-full md:basis-1/2 xl:basis-1/3"
          previousButtonClassName="left-2 top-1/2 -translate-y-1/2"
          nextButtonClassName="right-2 top-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
}
