"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleSlash2, Info, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ReviewItem, ReviewPageResult } from "../_types";

interface CourseReviewSectionProps {
  courseId: string;
  initialReviews: ReviewPageResult;
  showSourceCourse?: boolean;
  fetchBasePath?: string;
}

function getScoreTagClass(score: number | null) {
  if (score === null) {
    return "bg-muted text-muted-foreground";
  }
  if (score < 3) {
    return "bg-red-50 text-red-600";
  }
  if (score < 4) {
    return "bg-yellow-50 text-yellow-700";
  }
  return "bg-green-50 text-green-700";
}

function ScoreChip({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <CircleSlash2 className="size-3.5" />
      </span>
    );
  }

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${getScoreTagClass(score)}`}>
      {score.toFixed(1)}
    </span>
  );
}

function ScoreWithWeight({ score, weight }: { score: number | null; weight?: number }) {
  const normalizedWeight = weight ?? 1;
  const shouldShowWeight = score !== null && normalizedWeight > 0;

  return (
    <span className="inline-flex items-center gap-1">
      <ScoreChip score={score} />
      {shouldShowWeight && (
        <span className="w-4 text-center text-[10px] text-muted-foreground tabular-nums">x{normalizedWeight}</span>
      )}
    </span>
  );
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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage src={review.avatarUrl} alt={review.nickname} />
                  <AvatarFallback>{review.nickname.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{review.nickname}</p>
                  <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                  {showSourceCourse && review.sourceCourseName && (
                    <p className="text-xs text-muted-foreground">来源课程：{review.sourceCourseName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  综合评分
                  <ScoreChip score={review.overallScore} />
                </span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="size-3.5" />
                  {review.likesCount}
                </span>
              </div>
            </div>

            <div
              className={
                review.detailedScores && review.detailedScores.length > 0
                  ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]"
                  : "grid gap-3"
              }
            >
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="text-sm leading-6 text-muted-foreground">{review.summary}</p>
              </div>

              {review.detailedScores && review.detailedScores.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  <div className="space-y-2">
                    {review.detailedScores.slice(0, 4).map((item) => (
                      <div key={`${review.id}-${item.key}`} className="relative min-w-0 rounded border px-2 py-1.5">
                        {item.subItems && item.subItems.length > 0 && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 rounded-full  bg-background p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <Info className="size-3.5" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72 p-3">
                              <p className="mb-2 text-xs font-medium">细则评分</p>
                              <div className="space-y-1.5">
                                {item.subItems.map((subItem) => (
                                  <div
                                    key={`${review.id}-${item.key}-${subItem.key}`}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="text-xs text-muted-foreground">{subItem.label}</span>
                                    <ScoreWithWeight score={subItem.score} weight={subItem.weight} />
                                  </div>
                                ))}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="pr-5 text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
                          <ScoreWithWeight score={item.score} weight={item.weight} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {review.detailedScores.slice(4, 7).map((item) => (
                      <div key={`${review.id}-${item.key}`} className="relative min-w-0 rounded border px-2 py-1.5">
                        {item.subItems && item.subItems.length > 0 && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <Info className="size-3.5" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72 p-3">
                              <p className="mb-2 text-xs font-medium">细则评分</p>
                              <div className="space-y-1.5">
                                {item.subItems.map((subItem) => (
                                  <div
                                    key={`${review.id}-${item.key}-${subItem.key}`}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="text-xs text-muted-foreground">{subItem.label}</span>
                                    <ScoreWithWeight score={subItem.score} weight={subItem.weight} />
                                  </div>
                                ))}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="pr-5 text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
                          <ScoreWithWeight score={item.score} weight={item.weight} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
