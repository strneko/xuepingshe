import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PostRecord } from "./record-types";

interface PostHistoryItemProps {
  item: PostRecord;
}

export default function PostHistoryItem({ item }: PostHistoryItemProps) {
  return (
    <Link href={item.href} className="block transition-transform hover:-translate-y-0.5">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              点赞：{item.liked} · 评论：{item.commentCount}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">{item.postedAt}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
