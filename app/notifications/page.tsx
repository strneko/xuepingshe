"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { useNotificationStore } from "@/lib/notifications/store";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { NotificationItem } from "@/lib/notifications/types";
import { toast } from "sonner";

type NotificationCategory = "system" | "liked" | "reply";

function resolveCategory(item: NotificationItem): NotificationCategory {
  if (item.eventType === "community.post.like") {
    return "liked";
  }

  if (item.eventType === "community.post.comment") {
    return "reply";
  }

  return "system";
}

export default function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const lastPushedNotification = useNotificationStore((state) => state.lastPushedNotification);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);
  const lastToastNotificationIdRef = useRef<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("system");

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => Number(b.eventId) - Number(a.eventId)),
    [notifications],
  );

  const categoryStats = useMemo(() => {
    const base = {
      system: { total: 0, unread: 0 },
      liked: { total: 0, unread: 0 },
      reply: { total: 0, unread: 0 },
    };

    for (const item of sortedNotifications) {
      const category = resolveCategory(item);
      base[category].total += 1;
      if (!item.isRead) {
        base[category].unread += 1;
      }
    }

    return base;
  }, [sortedNotifications]);

  const filteredNotifications = useMemo(
    () => sortedNotifications.filter((item) => resolveCategory(item) === activeCategory),
    [activeCategory, sortedNotifications],
  );

  useEffect(() => {
    if (!lastPushedNotification) {
      return;
    }

    if (lastToastNotificationIdRef.current === lastPushedNotification.notificationId) {
      return;
    }

    lastToastNotificationIdRef.current = lastPushedNotification.notificationId;
    toast.info(lastPushedNotification.title, {
      description: lastPushedNotification.summary,
      action: {
        label: "查看",
        onClick: () => {
          window.location.href = lastPushedNotification.href ?? "/notifications";
        },
      },
    });
  }, [lastPushedNotification]);

  const handleRead = async (notificationId: string) => {
    await markRead(notificationId);
  };

  const handleReadAll = async () => {
    await markAllRead();
  };

  const handleDelete = async (notificationId: string) => {
    const ok = await deleteNotification(notificationId);
    if (ok) {
      toast.success("通知已删除");
      return;
    }

    toast.error("删除失败，请稍后重试");
  };

  return (
    <div className="px-[10vw] py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">消息中心</h1>
          <p className="text-sm text-muted-foreground">这里展示你的系统消息、收到的赞和回复提醒。</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleReadAll()}
          disabled={unreadCount === 0}
        >
          全部已读
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">消息分类</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                type="button"
                variant={activeCategory === "system" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setActiveCategory("system")}
              >
                <span>系统通知</span>
                <span className="text-xs">
                  {categoryStats.system.unread > 0 ? `${categoryStats.system.unread} 未读` : categoryStats.system.total}
                </span>
              </Button>
              <Button
                type="button"
                variant={activeCategory === "liked" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setActiveCategory("liked")}
              >
                <span>收到的赞</span>
                <span className="text-xs">
                  {categoryStats.liked.unread > 0 ? `${categoryStats.liked.unread} 未读` : categoryStats.liked.total}
                </span>
              </Button>
              <Button
                type="button"
                variant={activeCategory === "reply" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setActiveCategory("reply")}
              >
                <span>回复我的</span>
                <span className="text-xs">
                  {categoryStats.reply.unread > 0 ? `${categoryStats.reply.unread} 未读` : categoryStats.reply.total}
                </span>
              </Button>
            </CardContent>
          </Card>
        </aside>

        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">消息列表</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedNotifications.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  暂无消息
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  当前分类暂无消息
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start justify-between gap-2 rounded-md px-3 py-4 transition-colors hover:bg-accent"
                    >
                      <Link
                        href={item.href ?? "/notifications"}
                        onClick={() => void handleRead(item.id)}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium">{item.title}</h3>
                            {!item.isRead ? <Badge className="h-5 px-2 text-[10px]">未读</Badge> : null}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="border border-transparent text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-600 hover:bg-red-100 hover:text-red-700 focus-visible:border-red-300 focus-visible:bg-red-100 focus-visible:text-red-700 focus-visible:ring-red-500"
                        onClick={() => void handleDelete(item.id)}
                        aria-label="删除消息"
                        title="删除消息"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
