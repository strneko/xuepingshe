import { NotificationError } from "../errors";
import { notificationSseManager } from "../infra/sse-connection-manager";
import {
  countUnreadByUser,
  findUserNotificationByNotificationId,
  markReadById,
} from "../repositories/notification-repo";

export async function markNotificationRead(input: { userId: string; notificationId: string }) {
  const row = await findUserNotificationByNotificationId(input.userId, input.notificationId);

  if (!row || row.notification.status !== "ACTIVE") {
    throw new NotificationError("通知不存在", 404, "NOTIFICATION_NOT_FOUND");
  }

  if (!row.isRead) {
    await markReadById(row.id);
  }

  const unreadCount = await countUnreadByUser(input.userId);
  notificationSseManager.publishUnreadCount(input.userId, { unreadCount });

  return {
    read: true,
    notificationId: input.notificationId,
    unreadCount,
  };
}
