"use client";
import * as React from "react";
import { ReviewCarousel } from "./review-carousel";
import { ReviewItem } from "../course/[courseId]/_types";
import { Button } from "@/components/ui/button";

export default function Recommendations() {
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [isReviewLoading, setIsReviewLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isRefreshingRef = React.useRef(false);

  const fetchReviews = React.useCallback(async () => {
    const response = await fetch("/api/reviews/recommended", { method: "GET", cache: "no-store" });
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

  const handleRefresh = React.useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const data = await fetchReviews();
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [fetchReviews]);

  return (
    <div className="flex h-[calc(40vh-64px)] gap-20 justify-between ">
      <div className="absolute right-6 mt-4">
        <Button onClick={() => void handleRefresh()} disabled={isRefreshing || isReviewLoading}>
          {isRefreshing ? "刷新中..." : "刷新推荐"}
        </Button>
      </div>
      {isReviewLoading ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">热门评价加载中...</div>
      ) : (
        <ReviewCarousel
          reviews={reviews}
          variant="detailed"
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
