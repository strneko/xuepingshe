import { Star, StarHalf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ScoreBox from "@/components/score-box";
import { DimensionScore } from "../_types";

interface ScoreOverviewCardProps {
  overallScore: number;
  dimensions: DimensionScore[];
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
            <ScoreBox score={overallScore} digits={2} className="px-2 py-0.5 text-2xl font-bold" />
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">近期七项评分</p>
          {dimensions.map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <ScoreBox score={item.score} digits={1} />
              </div>
              {index < dimensions.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
