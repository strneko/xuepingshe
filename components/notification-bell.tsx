"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationsMock, formatRelativeTime } from "@/lib/mocks/notifications";

const PREVIEW_LIMIT = 5;

export default function NotificationBell() {
  const previewNotifications = notificationsMock.slice(0, PREVIEW_LIMIT);
  const unreadCount = notificationsMock.filter((item) => !item.isRead).length;
  const unreadLabel = unreadCount > 99 ? "99+" : `${unreadCount}`;

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Link
          href="/notifications"
          aria-label="通知"
          className="relative inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-5 text-white">
              {unreadLabel}
            </span>
          ) : null}
        </Link>
      </HoverCardTrigger>

      <HoverCardContent align="end" sideOffset={10} className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">通知</span>
          <Link href="/notifications" className="text-xs text-muted-foreground hover:text-foreground">
            查看全部
          </Link>
        </div>

        {previewNotifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">暂无通知</div>
        ) : (
          <ScrollArea className="h-72">
            <div className="p-2">
              {previewNotifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href ?? "/notifications"}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                    {!item.isRead ? <span className="mt-1 size-2 rounded-full bg-red-500" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
