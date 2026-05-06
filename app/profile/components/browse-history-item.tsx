import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BrowseRecord } from "./record-types";

interface BrowseHistoryItemProps {
  item: BrowseRecord;
}

export default function BrowseHistoryItem({ item }: BrowseHistoryItemProps) {
  const kindLabel = item.kind === "COURSE" ? "课程" : item.kind === "TEACHER" ? "教师" : "帖子";
  const kindClassName =
    item.kind === "COURSE"
      ? "bg-blue-100/50 text-blue-700 border-blue-200/60"
      : item.kind === "TEACHER"
        ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/60"
        : "bg-violet-100/50 text-violet-700 border-violet-200/60";

  return (
    <Link href={item.href} className="block transition-transform hover:-translate-y-0.5">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`shrink-0 text-xs ${kindClassName}`}>
                {kindLabel}
              </Badge>
              <span className="truncate font-medium">{item.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">点击可跳转到对应页面</p>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">{item.visitedAt}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
