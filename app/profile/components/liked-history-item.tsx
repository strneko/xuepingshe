import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LikedRecord } from "./record-types";

interface LikedHistoryItemProps {
  item: LikedRecord;
}

export default function LikedHistoryItem({ item }: LikedHistoryItemProps) {
  return (
    <Link href={item.href} className="block transition-transform hover:-translate-y-0.5">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">作者：{item.author}</span>
          </div>
          <span className="text-sm text-muted-foreground">{item.likedAt}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
