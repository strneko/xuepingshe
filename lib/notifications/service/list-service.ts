import { countUnreadByUser, listNotificationsByUser } from "../repositories/notification-repo";
import { NotificationListResult } from "../types";

export async function getNotificationList(input: {
  userId: string;
  cursor: bigint | null;
  limit: number;
  onlyUnread: boolean;
}): Promise<NotificationListResult> {
  const rows = await listNotificationsByUser(input);
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
    nextCursor: hasMore ? sliced[sliced.length - 1].eventId.toString() : null,
    hasMore,
    unreadCount,
  };
}
