import { countUnreadByUser, findLatestEventIdByUser } from "../repositories/notification-repo";

export async function getUnreadCount(userId: string) {
  const [unreadCount, latest] = await Promise.all([countUnreadByUser(userId), findLatestEventIdByUser(userId)]);

  return {
    unreadCount,
    latestEventId: latest?.eventId?.toString() ?? null,
  };
}
