import { countUnreadByUser, markAllReadByUser } from "../repositories/notification-repo";
import { notificationSseManager } from "../infra/sse-connection-manager";

export async function markAllNotificationsRead(userId: string) {
  const result = await markAllReadByUser(userId);
  const unreadCount = await countUnreadByUser(userId);
  notificationSseManager.publishUnreadCount(userId, { unreadCount });

  return {
    readAll: true,
    affectedCount: result.count,
    unreadCount,
  };
}
