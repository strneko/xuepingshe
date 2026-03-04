import { CircleSlash2, Info, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ReviewItem } from "../_types";

interface CourseReviewSectionProps {
  reviews: ReviewItem[];
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

export default function CourseReviewSection({ reviews }: CourseReviewSectionProps) {
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
      </CardContent>
    </Card>
  );
}
