"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewItem } from "@/app/course/[courseId]/_types";
import { ReviewCarousel } from "@/app/components/review-carousel";

interface TopReviewsCarouselPanelProps {
  title?: string;
  fetchUrl: string;
  showSourceCourse?: boolean;
  showSourceTeacher?: boolean;
}

export default function TopReviewsCarouselPanel({
  title = "高赞评价",
  fetchUrl,
  showSourceCourse = false,
  showSourceTeacher = false,
}: TopReviewsCarouselPanelProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(fetchUrl, { method: "GET" });
        if (!response.ok) {
          throw new Error("加载失败");
        }

        const data: ReviewItem[] = await response.json();
        if (!isCancelled) {
          setReviews(data);
        }
      } catch {
        if (!isCancelled) {
          setError("高赞评价加载失败");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, [fetchUrl]);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-xs text-muted-foreground">加载中...</p>;
    }

    if (error) {
      return <p className="text-xs text-destructive">{error}</p>;
    }

    return (
      <ReviewCarousel
        reviews={reviews}
        variant="brief"
        showSourceCourse={showSourceCourse}
        showSourceTeacher={showSourceTeacher}
        className="w-full h-64"
        contentClassName="h-64"
        itemClassName="basis-full h-full"
        previousButtonClassName="-left-6 top-1/2 -translate-y-1/2"
        nextButtonClassName="-right-6 top-1/2 -translate-y-1/2"
      />
    );
  }, [error, isLoading, reviews, showSourceCourse, showSourceTeacher]);

  return (
    <Card id="course-reviews">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{content}</CardContent>
    </Card>
  );
}
