import { CircleSlash2, Star, StarHalf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DimensionScore } from "../_types";

interface ScoreOverviewCardProps {
  overallScore: number;
  dimensions: DimensionScore[];
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

export default function ScoreOverviewCard({ overallScore, dimensions }: ScoreOverviewCardProps) {
  const clampedScore = Math.min(5, Math.max(0, overallScore));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">近期评分</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">综合评分</p>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = clampedScore >= star;
                const isHalf = !isFull && clampedScore >= star - 0.5;

                if (isHalf) {
                  return <StarHalf key={star} className="size-4 fill-current" />;
                }

                return <Star key={star} className={`size-4 ${isFull ? "fill-current" : "text-muted-foreground/35"}`} />;
              })}
            </div>
            <span className={`rounded px-2 py-0.5 text-2xl font-bold tabular-nums ${getScoreTagClass(overallScore)}`}>
              {overallScore.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">近期七项评分</p>
          {dimensions.map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <ScoreChip score={item.score} />
              </div>
              {index < dimensions.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
