import { Card, CardContent } from "@/components/ui/card";
import { UserRecordTab } from "./record-tabs";
import BrowseHistoryItem from "./browse-history-item";
import LikedHistoryItem from "./liked-history-item";
import PostHistoryItem from "./post-history-item";
import ReviewHistoryItem from "./review-history-item";
import { BrowseRecord, EMPTY_TEXT_MAP, HistoryItem, LikedRecord, PostRecord, ReviewRecord } from "./record-types";

interface HistoryListProps {
  tab: UserRecordTab;
  items: HistoryItem[];
}

export default function HistoryList({ tab, items }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">{EMPTY_TEXT_MAP[tab]}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        if (tab === "view") {
          return <BrowseHistoryItem key={item.id} item={item as BrowseRecord} />;
        }

        if (tab === "review") {
          return <ReviewHistoryItem key={item.id} item={item as ReviewRecord} />;
        }

        if (tab === "post") {
          return <PostHistoryItem key={item.id} item={item as PostRecord} />;
        }

        return <LikedHistoryItem key={item.id} item={item as LikedRecord} />;
      })}
    </div>
  );
}
