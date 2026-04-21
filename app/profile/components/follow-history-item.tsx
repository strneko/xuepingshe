import { Card, CardContent } from "@/components/ui/card";
import { FollowRecord } from "./record-types";

interface FollowHistoryItemProps {
  item: FollowRecord;
}

export default function FollowHistoryItem({ item }: FollowHistoryItemProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.department}</span>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">{item.followedAt}</span>
      </CardContent>
    </Card>
  );
}
