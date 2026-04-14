"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReviewDetailedCard from "@/components/review-detailed-card";
import { Separator } from "@/components/ui/separator";
import { ReviewItem, ReviewPageResult } from "../_types";

interface CourseReviewSectionProps {
  courseId: string;
  initialReviews: ReviewPageResult;
  showSourceCourse?: boolean;
  fetchBasePath?: string;
}

export default function CourseReviewSection({
  courseId,
  initialReviews,
  showSourceCourse = false,
  fetchBasePath = "/api/courses",
}: CourseReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialReviews.nextCursor);
  const [hasMore, setHasMore] = useState(initialReviews.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [likingReviewId, setLikingReviewId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const totalLoaded = reviews.length;
  const totalCount = initialReviews.total;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !nextCursor) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        cursor: nextCursor,
        limit: "10",
      });
      const response = await fetch(`${fetchBasePath}/${courseId}/reviews?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("加载失败");
      }

      const page: ReviewPageResult = await response.json();
      setReviews((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const appended = page.items.filter((item) => !existing.has(item.id));
        return [...prev, ...appended];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setLoadError("评论加载失败，请重试");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchBasePath, hasMore, isLoading, nextCursor]);

  const handleLikeReview = useCallback(
    async (review: ReviewItem) => {
      if (likingReviewId) {
        return;
      }

      setLikingReviewId(review.id);
      setLoadError(null);

      const nextLiked = !review.liked;
      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                liked: nextLiked,
                likesCount: Math.max(0, item.likesCount + (nextLiked ? 1 : -1)),
              }
            : item,
        ),
      );

      try {
        const response = await fetch(`${fetchBasePath}/${courseId}/reviews/${review.id}/like`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("点赞失败");
        }

        const result: { reviewId: string; likesCount: number; liked: boolean } = await response.json();
        setReviews((prev) =>
          prev.map((item) =>
            item.id === result.reviewId
              ? {
                  ...item,
                  liked: result.liked,
                  likesCount: result.likesCount,
                }
              : item,
          ),
        );
      } catch {
        setReviews((prev) =>
          prev.map((item) =>
            item.id === review.id
              ? {
                  ...item,
                  liked: review.liked ?? false,
                  likesCount: review.likesCount,
                }
              : item,
          ),
        );
        setLoadError("点赞失败，请稍后重试");
      } finally {
        setLikingReviewId(null);
      }
    },
    [courseId, fetchBasePath, likingReviewId],
  );

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) {
      return;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "500px 0px",
        threshold: 0,
      },
    );

    observerRef.current.observe(target);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadMore]);

  const footerText = useMemo(() => {
    if (hasMore) {
      return null;
    }

    if (totalLoaded >= totalCount) {
      return "已加载全部评论";
    }

    return "暂无更多评论";
  }, [hasMore, totalCount, totalLoaded]);

  return (
    <Card id="course-reviews">
      <CardHeader>
        <CardTitle className="text-base">评价区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review, index) => (
          <div key={review.id} className="space-y-2">
            <ReviewDetailedCard
              review={review}
              liked={Boolean(review.liked)}
              disabled={likingReviewId === review.id}
              onLike={() => void handleLikeReview(review)}
              showSourceCourse={showSourceCourse}
            />

            {index < reviews.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}

        {isLoading && <p className="text-center text-xs text-muted-foreground">正在加载更多评论...</p>}

        {loadError && (
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-destructive">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => void loadMore()}>
              重试
            </Button>
          </div>
        )}

        {!isLoading && footerText && <p className="text-center text-xs text-muted-foreground">{footerText}</p>}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
