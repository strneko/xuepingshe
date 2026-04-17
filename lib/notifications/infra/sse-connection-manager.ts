import { NotificationDeletedEvent, NotificationPushEvent, NotificationUnreadCountEvent } from "../types";

type NotificationStreamEvent =
  | {
      event: "notification";
      id: string;
      data: NotificationPushEvent;
    }
  | {
      event: "unread-count";
      data: NotificationUnreadCountEvent;
    }
  | {
      event: "notification-deleted";
      data: NotificationDeletedEvent;
    };

type Listener = (payload: NotificationStreamEvent) => void;

class SseConnectionManager {
  private readonly listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener) {
    const set = this.listeners.get(userId) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(userId, set);

    return () => {
      const current = this.listeners.get(userId);
      if (!current) {
        return;
      }

      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  publishNotification(userId: string, payload: NotificationPushEvent) {
    const set = this.listeners.get(userId);
    if (!set || set.size === 0) {
      return;
    }

    for (const listener of set) {
      listener({
        event: "notification",
        id: payload.eventId,
        data: payload,
      });
    }
  }

  publishUnreadCount(userId: string, payload: NotificationUnreadCountEvent) {
    const set = this.listeners.get(userId);
    if (!set || set.size === 0) {
      return;
    }

    for (const listener of set) {
      listener({
        event: "unread-count",
        data: payload,
      });
    }
  }

  publishNotificationDeleted(userId: string, payload: NotificationDeletedEvent) {
    const set = this.listeners.get(userId);
    if (!set || set.size === 0) {
      return;
    }

    for (const listener of set) {
      listener({
        event: "notification-deleted",
        data: payload,
      });
    }
  }
}

const globalStore = globalThis as unknown as {
  notificationSseManager?: SseConnectionManager;
};

export const notificationSseManager =
  globalStore.notificationSseManager ?? (globalStore.notificationSseManager = new SseConnectionManager());
