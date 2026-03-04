import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CircleSlash2, ThumbsUp } from "lucide-react";
import { ReviewItem } from "../_types";

interface TopReviewsCardProps {
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

export default function TopReviewsCard({ reviews }: TopReviewsCardProps) {
  return (
    <Card id="course-reviews">
      <CardHeader>
        <CardTitle className="text-base">高赞评价</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review, index) => (
          <div key={review.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
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
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ThumbsUp className="size-3.5" />
                {review.likesCount}
              </span>
            </div>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              综合评分：
              <ScoreChip score={review.overallScore} />
            </p>
            <p className="text-sm text-muted-foreground">{review.summary}</p>
            {index < reviews.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
