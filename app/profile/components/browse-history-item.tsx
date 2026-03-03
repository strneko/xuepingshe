import { Card, CardContent } from "@/components/ui/card";
import { BrowseRecord } from "./record-types";

interface BrowseHistoryItemProps {
  item: BrowseRecord;
}

export default function BrowseHistoryItem({ item }: BrowseHistoryItemProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <span className="font-medium">{item.courseName}</span>
        <span className="text-sm text-muted-foreground">{item.visitedAt}</span>
      </CardContent>
    </Card>
  );
}
