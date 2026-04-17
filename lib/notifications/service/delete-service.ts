import { NotificationError } from "../errors";
import { notificationSseManager } from "../infra/sse-connection-manager";
import {
  countUnreadByUser,
  countUsersByNotificationId,
  deleteUserNotificationByNotificationId,
  findUserNotificationByNotificationId,
  markNotificationDeleted,
} from "../repositories/notification-repo";

export async function deleteNotification(input: { userId: string; notificationId: string }) {
  const row = await findUserNotificationByNotificationId(input.userId, input.notificationId);

  if (!row || row.notification.status !== "ACTIVE") {
    throw new NotificationError("通知不存在", 404, "NOTIFICATION_NOT_FOUND");
  }

  await deleteUserNotificationByNotificationId(input.userId, input.notificationId);

  const remainingUsers = await countUsersByNotificationId(input.notificationId);
  if (remainingUsers === 0) {
    await markNotificationDeleted(input.notificationId);
  }

  const unreadCount = await countUnreadByUser(input.userId);
  notificationSseManager.publishNotificationDeleted(input.userId, {
    notificationId: input.notificationId,
    unreadCount,
  });
  notificationSseManager.publishUnreadCount(input.userId, { unreadCount });

  return {
    deleted: true,
    notificationId: input.notificationId,
    unreadCount,
  };
}
