"use client";
import * as React from "react";
import { ReviewCarousel } from "./review-carousel";
import { ReviewItem } from "../course/[courseId]/_types";
import { useRecommendedReviewLike } from "./hooks/use-recommended-review-like";
import { Skeleton } from "@/components/ui/skeleton";

function ReviewCardSkeleton() {
  return (
    <div className="rounded-md border bg-card p-3 space-y-3">
      {/* Header: avatar + info + score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>
      </div>
      {/* Summary */}
      <div className="rounded-md border bg-muted/20 p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      {/* Score grid */}
      <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded border px-2 py-1.5 flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <div className="flex gap-4 w-full px-10 py-5">
          <div className="w-full md:w-1/2 xl:w-1/3 shrink-0">
            <ReviewCardSkeleton />
          </div>
          <div className="hidden md:block md:w-1/2 xl:w-1/3 shrink-0">
            <ReviewCardSkeleton />
          </div>
          <div className="hidden xl:block xl:w-1/3 shrink-0">
            <ReviewCardSkeleton />
          </div>
        </div>
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
