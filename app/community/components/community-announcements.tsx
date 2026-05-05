import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityAnnouncement } from "../_types";

type CommunityAnnouncementsProps = {
  items: CommunityAnnouncement[];
  isAdmin?: boolean;
  onEdit?: (item: CommunityAnnouncement) => void;
  onDelete?: (item: CommunityAnnouncement) => void;
  onMoveUp?: (item: CommunityAnnouncement) => void;
  onMoveDown?: (item: CommunityAnnouncement) => void;
};

export default function CommunityAnnouncements({
  items,
  isAdmin = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CommunityAnnouncementsProps) {
  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">公告栏</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent group">
            <Link
              href={item.href ?? "/community"}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <Pin className="size-4 shrink-0 text-orange-500" />
              <span className="line-clamp-1">{item.title}</span>
            </Link>
            {isAdmin ? (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={() => onMoveUp?.(item)}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === items.length - 1}
                  onClick={() => onMoveDown?.(item)}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => onEdit?.(item)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive hover:text-destructive"
                  onClick={() => onDelete?.(item)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? <p className="px-2 py-2 text-sm text-muted-foreground">暂无公告</p> : null}
      </CardContent>
    </Card>
  );
}
