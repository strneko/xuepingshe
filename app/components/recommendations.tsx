"use client";
import * as React from "react";
import { ReviewCarousel } from "./review-carousel";
import RecommendedList from "./recommended-list";
import { ReviewItem } from "../course/[courseId]/_types";

export default function Recommendations() {
  const [items, setItems] = React.useState<number[]>(() => Array.from({ length: 6 }, (_, index) => index));
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [isReviewLoading, setIsReviewLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isRefreshingRef = React.useRef(false);

  React.useEffect(() => {
    let isCancelled = false;

    const fetchReviews = async () => {
      setIsReviewLoading(true);

      try {
        const response = await fetch("/api/reviews/recommended", { method: "GET" });
        if (!response.ok) {
          throw new Error("加载失败");
        }

        const data: ReviewItem[] = await response.json();
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

    void fetchReviews();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = React.useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      // TODO: replace with backend API call.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setItems(Array.from({ length: 6 }, (_, index) => Date.now() + index));
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] gap-20 justify-between ">
      <div className="flex-1">
        {isReviewLoading ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">热门评价加载中...</div>
        ) : (
          <ReviewCarousel
            reviews={reviews}
            variant="detailed"
            showSourceCourse
            showSourceTeacher
            className="h-[calc(100vh-200px)] mt-14.5 p-5"
            contentClassName="h-[calc(100vh-200px)]"
            itemClassName="basis-full"
          />
        )}
      </div>
      <RecommendedList className="flex-2" items={items} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}
