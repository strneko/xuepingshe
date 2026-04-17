import { countUnreadByUser, listNotificationsSince } from "../repositories/notification-repo";
import { NotificationSyncResult } from "../types";

export async function syncNotifications(input: {
  userId: string;
  sinceEventId: bigint;
  limit: number;
}): Promise<NotificationSyncResult> {
  const rows = await listNotificationsSince(input);
  const hasMore = rows.length > input.limit;
  const sliced = hasMore ? rows.slice(0, input.limit) : rows;
  const unreadCount = await countUnreadByUser(input.userId);

  return {
    items: sliced.map((row) => ({
      id: row.notification.id,
      eventId: row.eventId.toString(),
      title: row.notification.title,
      summary: row.notification.summary,
      href: row.notification.href ?? undefined,
      createdAt: row.notification.createdAt.toISOString(),
      isRead: row.isRead,
    })),
    nextSinceEventId: hasMore ? sliced[sliced.length - 1].eventId.toString() : null,
    hasMore,
    unreadCount,
  };
}
