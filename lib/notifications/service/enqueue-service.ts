import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotificationError } from "../errors";
import { buildDefaultDedupeKey, NotificationEnqueuePayload } from "../infra/queue";
import { notificationSseManager } from "../infra/sse-connection-manager";
import { countUnreadByUser } from "../repositories/notification-repo";

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

  const result = await prisma.$transaction(async (tx) => {
    try {
      await tx.notificationEnqueueDedupe.create({
        data: { dedupeKey },
      });
    } catch (error) {
      const known = error as Prisma.PrismaClientKnownRequestError;
      if (known?.code === "P2002") {
        return { accepted: true, jobId: dedupeKey, notification: null };
      }

      throw error;
    }

    const notification = await tx.notification.create({
      data: {
        eventType: input.eventType,
        title: parseTitle(input.payload, input.eventType),
        summary: parseSummary(input.payload),
        href: parseHref(input.payload),
        payload: input.payload as Prisma.InputJsonValue,
        status: "ACTIVE",
      },
    });

    await tx.userNotification.createMany({
      data: receiverIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        eventId: notification.eventId,
        isRead: false,
        deliveredAt: new Date(),
      })),
      skipDuplicates: true,
    });

    await tx.notificationEnqueueDedupe.update({
      where: { dedupeKey },
      data: { notificationId: notification.id },
    });

    return { accepted: true, jobId: notification.eventId.toString(), notification };
  });

  if (!result.notification) {
    return {
      accepted: true,
      jobId: result.jobId,
    };
  }

  await Promise.all(
    receiverIds.map(async (userId) => {
      const unreadCount = await countUnreadByUser(userId);
      notificationSseManager.publishNotification(userId, {
        eventId: result.notification.eventId.toString(),
        notificationId: result.notification.id,
        eventType: result.notification.eventType,
        title: result.notification.title,
        summary: result.notification.summary,
        href: result.notification.href ?? undefined,
        payload: (result.notification.payload as Record<string, unknown> | null) ?? undefined,
        createdAt: result.notification.createdAt.toISOString(),
        unreadCount,
      });
    }),
  );

  return {
    accepted: true,
    jobId: result.notification.eventId.toString(),
  };
}
