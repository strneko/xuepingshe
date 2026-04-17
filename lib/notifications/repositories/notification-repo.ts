import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export function createNotification(data: Prisma.NotificationCreateInput) {
  return prisma.notification.create({ data });
}

export function createEnqueueDedupeKey(dedupeKey: string) {
  return prisma.notificationEnqueueDedupe.create({
    data: { dedupeKey },
  });
}

export function linkEnqueueDedupeToNotification(dedupeKey: string, notificationId: string) {
  return prisma.notificationEnqueueDedupe.update({
    where: { dedupeKey },
    data: { notificationId },
  });
}

export function listNotificationsByUser(params: {
  userId: string;
  cursor: bigint | null;
  limit: number;
  onlyUnread: boolean;
}) {
  return prisma.userNotification.findMany({
    where: {
      userId: params.userId,
      ...(params.onlyUnread ? { isRead: false } : {}),
      ...(params.cursor ? { eventId: { lt: params.cursor } } : {}),
      notification: {
        status: "ACTIVE",
      },
    },
    orderBy: [{ eventId: "desc" }],
    take: params.limit + 1,
    include: {
      notification: true,
    },
  });
}

export function listNotificationsSince(params: { userId: string; sinceEventId: bigint; limit: number }) {
  return prisma.userNotification.findMany({
    where: {
      userId: params.userId,
      eventId: { gt: params.sinceEventId },
      notification: {
        status: "ACTIVE",
      },
    },
    orderBy: [{ eventId: "asc" }],
    take: params.limit + 1,
    include: {
      notification: true,
    },
  });
}

export function countUnreadByUser(userId: string) {
  return prisma.userNotification.count({
    where: {
      userId,
      isRead: false,
      notification: {
        status: "ACTIVE",
      },
    },
  });
}

export function findUserNotificationByNotificationId(userId: string, notificationId: string) {
  return prisma.userNotification.findFirst({
    where: {
      userId,
      notificationId,
    },
    include: {
      notification: true,
    },
  });
}

export function deleteUserNotificationByNotificationId(userId: string, notificationId: string) {
  return prisma.userNotification.deleteMany({
    where: {
      userId,
      notificationId,
    },
  });
}

export function countUsersByNotificationId(notificationId: string) {
  return prisma.userNotification.count({
    where: {
      notificationId,
    },
  });
}

export function markNotificationDeleted(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "DELETED",
    },
  });
}

export function markReadById(id: string) {
  return prisma.userNotification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export function markAllReadByUser(userId: string) {
  return prisma.userNotification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export function createUserNotifications(data: Prisma.UserNotificationCreateManyInput[]) {
  return prisma.userNotification.createMany({
    data,
    skipDuplicates: true,
  });
}

export function findLatestEventIdByUser(userId: string) {
  return prisma.userNotification.findFirst({
    where: {
      userId,
      notification: {
        status: "ACTIVE",
      },
    },
    orderBy: [{ eventId: "desc" }],
    select: {
      eventId: true,
    },
  });
}
