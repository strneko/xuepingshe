import { CircleSlash2, Info, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ReviewItem } from "@/app/course/[courseId]/_types";
import { cn } from "@/lib/utils";

interface ReviewDetailedCardProps {
  review: ReviewItem;
  showSourceCourse?: boolean;
  showSourceTeacher?: boolean;
  fallbackCourseName?: string;
  fallbackTeacherName?: string;
  liked?: boolean;
  disabled?: boolean;
  onLike?: (review: ReviewItem) => void;
  className?: string;
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

export default function ReviewDetailedCard({
  review,
  showSourceCourse = false,
  showSourceTeacher = false,
  fallbackCourseName,
  fallbackTeacherName,
  liked = false,
  disabled = false,
  onLike,
  className,
}: ReviewDetailedCardProps) {
  const sourceCourse = review.sourceCourseName ?? fallbackCourseName;
  const sourceTeacher = review.sourceTeacherName ?? fallbackTeacherName;
  const detailedScores = (review.detailedScores ?? [])
    .filter((item) => item.score !== null)
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter((subItem) => subItem.score !== null),
    }));
  const hasSummary = review.summary.trim().length > 0;
  const hasDetailedScores = detailedScores.length > 0;

  return (
    <div className={cn("@container space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={review.avatarUrl} alt={review.nickname} />
            <AvatarFallback>{review.nickname.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{review.nickname}</p>
            <p className="text-xs text-muted-foreground">{review.createdAt}</p>
            {showSourceCourse && sourceCourse && <p className="text-xs text-muted-foreground">课程：{sourceCourse}</p>}
            {showSourceTeacher && sourceTeacher && (
              <p className="text-xs text-muted-foreground">教师：{sourceTeacher}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            综合评分
            <ScoreChip score={review.overallScore} />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground",
              liked && "bg-accent text-foreground hover:bg-accent",
              disabled && "cursor-not-allowed opacity-60",
            )}
            onClick={() => onLike?.(review)}
          >
            <ThumbsUp className={cn("size-3.5", liked && "fill-current")} />
            {review.likesCount}
          </Button>
        </div>
      </div>

      <div
        className={
          hasSummary && hasDetailedScores ? "grid gap-3 @[600px]:grid-cols-[minmax(0,1fr)_400px]" : "grid gap-3"
        }
      >
        {hasSummary && (
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-sm leading-6 text-muted-foreground">{review.summary}</p>
          </div>
        )}

        {hasDetailedScores && (
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
            <div className="space-y-2">
              {detailedScores.slice(0, 4).map((item) => (
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
            <div className="space-y-2">
              {detailedScores.slice(4, 7).map((item) => (
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
    </div>
  );
}
