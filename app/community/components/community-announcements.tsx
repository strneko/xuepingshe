import Link from "next/link";
import { Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { communityAnnouncements } from "@/lib/mocks/community";

export default function CommunityAnnouncements() {
  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">公告栏</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {communityAnnouncements.map((item) => (
          <Link
            key={item.id}
            href={item.href ?? "/community"}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Pin className="size-4 shrink-0 text-orange-500" />
            <span className="line-clamp-1">{item.title}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
