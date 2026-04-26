import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CommentRecord } from "./record-types";

interface CommentHistoryItemProps {
  item: CommentRecord;
}

export default function CommentHistoryItem({ item }: CommentHistoryItemProps) {
  return (
    <Link href={item.href} className="block transition-transform hover:-translate-y-0.5">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-start justify-between gap-4 py-4">
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">{item.content}</span>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">{item.commentAt}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
