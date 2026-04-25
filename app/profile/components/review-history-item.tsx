import { Card, CardContent } from "@/components/ui/card";
import ScoreBox from "@/components/score-box";
import { ReviewRecord } from "./record-types";

interface ReviewHistoryItemProps {
  item: ReviewRecord;
}

export default function ReviewHistoryItem({ item }: ReviewHistoryItemProps) {
  const scoreValue = Number(item.score);

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.courseName}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            评分：
            <ScoreBox score={Number.isFinite(scoreValue) ? scoreValue : null} digits={1} className="align-middle" />
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{item.reviewedAt}</span>
      </CardContent>
    </Card>
  );
}
