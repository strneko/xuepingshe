import Link from "next/link";
import { Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityAnnouncement } from "../_types";

type CommunityAnnouncementsProps = {
  items: CommunityAnnouncement[];
};

export default function CommunityAnnouncements({ items }: CommunityAnnouncementsProps) {
  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">公告栏</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href ?? "/community"}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Pin className="size-4 shrink-0 text-orange-500" />
            <span className="line-clamp-1">{item.title}</span>
          </Link>
        ))}
        {items.length === 0 ? <p className="px-2 py-2 text-sm text-muted-foreground">暂无公告</p> : null}
      </CardContent>
    </Card>
  );
}
