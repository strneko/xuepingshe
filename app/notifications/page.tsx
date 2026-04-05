import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notificationsMock, formatRelativeTime } from "@/lib/mocks/notifications";

export default function NotificationsPage() {
  const notifications = [...notificationsMock].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="px-[10vw] py-8">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>通知中心</CardTitle>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              返回首页
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">这里展示你的系统消息、课程动态和互动提醒。</p>
        </CardHeader>

        <CardContent>
          {notifications.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href ?? "/notifications"}
                  className="block rounded-md px-3 py-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      {!item.isRead ? <Badge className="h-5 px-2 text-[10px]">未读</Badge> : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
