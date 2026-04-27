"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import ReviewDetailedCard from "@/components/review-detailed-card";
import ReviewBriefCard from "@/components/review-brief-card";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ReviewItem } from "../course/[courseId]/_types";

interface MyCardCarouselProps {
  className?: string;
  reviews: ReviewItem[];
  variant?: "brief" | "detailed";
  disabledReviewId?: string | null;
  onLikeReview?: (review: ReviewItem) => void;
  itemClassName?: string;
  contentClassName?: string;
  showSourceCourse?: boolean;
  showSourceTeacher?: boolean;
  previousButtonClassName?: string;
  nextButtonClassName?: string;
}

export function ReviewCarousel({
  className,
  reviews,
  variant = "detailed",
  disabledReviewId,
  onLikeReview,
  itemClassName,
  contentClassName,
  showSourceCourse = true,
  showSourceTeacher = true,
  previousButtonClassName,
  nextButtonClassName,
}: MyCardCarouselProps) {
  const autoplay = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  const itemClasses = variant === "brief" ? cn("basis-full") : cn("basis-full md:basis-1/2", itemClassName);

  if (reviews.length === 0) {
    return <div className={cn("rounded-md border p-4 text-sm text-muted-foreground", className)}>暂无热门评价</div>;
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      orientation="horizontal"
      plugins={[autoplay.current]}
      className={cn("w-full", className)}
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
    >
      <CarouselContent className={cn("mt-1 ", contentClassName)}>
        {reviews.map((review) => (
          <CarouselItem key={review.id} className={cn("flex items-center", itemClasses)}>
            <div className="p-1 w-full">
              <div className="rounded-md border bg-card p-3">
                {variant === "detailed" ? (
                  <ReviewDetailedCard
                    review={review}
                    liked={Boolean(review.liked)}
                    disabled={disabledReviewId === review.id}
                    onLike={onLikeReview}
                    showSourceCourse={showSourceCourse}
                    showSourceTeacher={showSourceTeacher}
                  />
                ) : (
                  <ReviewBriefCard review={review} showCourse={showSourceCourse} showTeacher={showSourceTeacher} />
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className={previousButtonClassName} />
      <CarouselNext className={nextButtonClassName} />
    </Carousel>
  );
}
