import { Prisma } from "@prisma/client";
import { NotificationError } from "../errors";
import { buildDefaultDedupeKey, NotificationEnqueuePayload } from "../infra/queue";
import { notificationSseManager } from "../infra/sse-connection-manager";
import {
  countUnreadByUser,
  createEnqueueDedupeKey,
  createNotification,
  createUserNotifications,
  linkEnqueueDedupeToNotification,
} from "../repositories/notification-repo";

function parseTitle(payload: Record<string, unknown>, eventType: string) {
  const title = payload.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return `新通知（${eventType}）`;
}

function parseSummary(payload: Record<string, unknown>) {
  const summary = payload.summary;
  if (typeof summary === "string" && summary.trim()) {
    return summary.trim();
  }

  return "你有一条新的通知。";
}

function parseHref(payload: Record<string, unknown>) {
  const href = payload.href;
  if (typeof href === "string" && href.trim()) {
    return href.trim();
  }

  return "/notifications";
}

export async function enqueueNotification(input: NotificationEnqueuePayload) {
  if (!input.eventType.trim()) {
    throw new NotificationError("eventType 不能为空", 400, "INVALID_PAYLOAD");
  }

  if (!input.bizId.trim()) {
    throw new NotificationError("bizId 不能为空", 400, "INVALID_PAYLOAD");
  }

  const receiverIds = [...new Set(input.receiverIds.map((item) => item.trim()).filter(Boolean))];
  if (receiverIds.length === 0) {
    throw new NotificationError("receiverIds 不能为空", 400, "INVALID_PAYLOAD");
  }

  const dedupeKey = input.dedupeKey?.trim() || buildDefaultDedupeKey({ ...input, receiverIds });

  try {
    await createEnqueueDedupeKey(dedupeKey);
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known?.code === "P2002") {
      return {
        accepted: true,
        jobId: dedupeKey,
      };
    }

    throw error;
  }

  const notification = await createNotification({
    eventType: input.eventType,
    title: parseTitle(input.payload, input.eventType),
    summary: parseSummary(input.payload),
    href: parseHref(input.payload),
    payload: input.payload,
    status: "ACTIVE",
  });

  await createUserNotifications(
    receiverIds.map((userId) => ({
      userId,
      notificationId: notification.id,
      eventId: notification.eventId,
      isRead: false,
      deliveredAt: new Date(),
    })),
  );

  await linkEnqueueDedupeToNotification(dedupeKey, notification.id);

  await Promise.all(
    receiverIds.map(async (userId) => {
      const unreadCount = await countUnreadByUser(userId);
      notificationSseManager.publishNotification(userId, {
        eventId: notification.eventId.toString(),
        notificationId: notification.id,
        title: notification.title,
        summary: notification.summary,
        href: notification.href ?? undefined,
        createdAt: notification.createdAt.toISOString(),
        unreadCount,
      });
    }),
  );

  return {
    accepted: true,
    jobId: notification.eventId.toString(),
  };
}
