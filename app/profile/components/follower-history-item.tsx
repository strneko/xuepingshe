import { Card, CardContent } from "@/components/ui/card";
import { FollowerRecord } from "./record-types";

interface FollowerHistoryItemProps {
  item: FollowerRecord;
}

export default function FollowerHistoryItem({ item }: FollowerHistoryItemProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.introduction}</span>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">{item.followedAt}</span>
      </CardContent>
    </Card>
  );
}
