import { Card, CardContent } from "@/components/ui/card";
import { ReviewRecord } from "./record-types";

interface ReviewHistoryItemProps {
  item: ReviewRecord;
}

export default function ReviewHistoryItem({ item }: ReviewHistoryItemProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.courseName}</span>
          <span className="text-xs text-muted-foreground">评分：{item.score}</span>
        </div>
        <span className="text-sm text-muted-foreground">{item.reviewedAt}</span>
      </CardContent>
    </Card>
  );
}
