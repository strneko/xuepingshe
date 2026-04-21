import { Card, CardContent } from "@/components/ui/card";
import { UserRecordTab } from "./record-tabs";
import BrowseHistoryItem from "./browse-history-item";
import CommentHistoryItem from "./comment-history-item";
import FollowerHistoryItem from "./follower-history-item";
import FollowHistoryItem from "./follow-history-item";
import LikedHistoryItem from "./liked-history-item";
import PostHistoryItem from "./post-history-item";
import ReviewHistoryItem from "./review-history-item";
import {
  BrowseRecord,
  CommentRecord,
  EMPTY_TEXT_MAP,
  FollowerRecord,
  FollowRecord,
  HistoryItem,
  LikedRecord,
  PostRecord,
  ReviewRecord,
} from "./record-types";

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

        if (tab === "comment") {
          return <CommentHistoryItem key={item.id} item={item as CommentRecord} />;
        }

        if (tab === "following") {
          return <FollowHistoryItem key={item.id} item={item as FollowRecord} />;
        }

        if (tab === "followers") {
          return <FollowerHistoryItem key={item.id} item={item as FollowerRecord} />;
        }

        return <LikedHistoryItem key={item.id} item={item as LikedRecord} />;
      })}
    </div>
  );
}
