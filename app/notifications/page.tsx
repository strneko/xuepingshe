"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/time/format-relative-time";
import { useNotificationStore } from "@/lib/notifications/store";
import { toast } from "sonner";

export default function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const lastPushedNotification = useNotificationStore((state) => state.lastPushedNotification);
  const initialize = useNotificationStore((state) => state.initialize);
  const connectStream = useNotificationStore((state) => state.connectStream);
  const disconnectStream = useNotificationStore((state) => state.disconnectStream);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);
  const lastToastNotificationIdRef = useRef<string | null>(null);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => Number(b.eventId) - Number(a.eventId)),
    [notifications],
  );

  useEffect(() => {
    void initialize(50);
    connectStream();

    return () => {
      disconnectStream();
    };
  }, [connectStream, disconnectStream, initialize]);

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
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>消息中心</CardTitle>
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
          <p className="text-sm text-muted-foreground">这里展示你的系统消息、课程动态和互动提醒。</p>
        </CardHeader>

        <CardContent>
          {sortedNotifications.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              暂无消息
            </div>
          ) : (
            <div className="divide-y">
              {sortedNotifications.map((item) => (
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
                    className="opacity-0 transition-opacity group-hover:opacity-100"
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
    </div>
  );
}
