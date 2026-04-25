"use client";

import { create } from "zustand";
import { NotificationItem, NotificationPushEvent } from "./types";

const MAX_ITEMS = 200;

let initPromise: Promise<void> | null = null;
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let subscriberCount = 0;

function sortByEventIdDesc(items: NotificationItem[]) {
  return [...items].sort((a, b) => Number(b.eventId) - Number(a.eventId));
}

function mergeUniqueItems(items: NotificationItem[]) {
  const map = new Map<string, NotificationItem>();
  for (const item of items) {
    map.set(item.id, item);
  }

  return sortByEventIdDesc(Array.from(map.values())).slice(0, MAX_ITEMS);
}

interface NotificationStoreState {
  items: NotificationItem[];
  unreadCount: number;
  initialized: boolean;
  latestEventId: string | null;
  lastPushedNotification: NotificationPushEvent | null;
  initialize: (limit?: number) => Promise<void>;
  connectStream: () => void;
  disconnectStream: () => void;
  markRead: (notificationId: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
}

function scheduleReconnect() {
  if (reconnectTimer || subscriberCount === 0) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    useNotificationStore.getState().connectStream();
  }, 2000);
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  items: [],
  unreadCount: 0,
  initialized: false,
  latestEventId: null,
  lastPushedNotification: null,
  async initialize(limit = 50) {
    if (get().initialized) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      const response = await fetch(`/api/notifications?limit=${limit}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        items?: NotificationItem[];
        unreadCount?: number;
      };

      const items = mergeUniqueItems(data.items ?? []);

      set({
        items,
        unreadCount: Number(data.unreadCount ?? 0),
        initialized: true,
        latestEventId: items[0]?.eventId ?? null,
      });
    })().finally(() => {
      initPromise = null;
    });

    return initPromise;
  },
  connectStream() {
    subscriberCount += 1;

    if (eventSource) {
      return;
    }

    eventSource = new EventSource("/api/notifications/stream");

    eventSource.addEventListener("notification", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as NotificationPushEvent;

      set((state) => {
        const nextItem: NotificationItem = {
          id: payload.notificationId,
          eventId: payload.eventId,
          eventType: payload.eventType,
          title: payload.title,
          summary: payload.summary,
          href: payload.href,
          payload: payload.payload,
          createdAt: payload.createdAt,
          isRead: false,
        };

        const items = mergeUniqueItems([nextItem, ...state.items]);

        return {
          items,
          unreadCount: Number(payload.unreadCount ?? state.unreadCount),
          latestEventId: payload.eventId,
          lastPushedNotification: payload,
        };
      });
    });

    eventSource.addEventListener("unread-count", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as { unreadCount: number };
      set({ unreadCount: Number(payload.unreadCount ?? 0) });
    });

    eventSource.addEventListener("notification-deleted", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        notificationId: string;
        unreadCount: number;
      };

      set((state) => ({
        unreadCount: Number(payload.unreadCount ?? state.unreadCount),
        items: state.items.filter((item) => item.id !== payload.notificationId),
      }));
    });

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      scheduleReconnect();
    };
  },
  disconnectStream() {
    subscriberCount = Math.max(0, subscriberCount - 1);

    if (subscriberCount > 0) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  },
  async markRead(notificationId: string) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { unreadCount: number };

    set((state) => ({
      unreadCount: Number(data.unreadCount ?? state.unreadCount),
      items: state.items.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    }));

    return true;
  },
  async markAllRead() {
    const response = await fetch("/api/notifications/read-all", {
      method: "POST",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { unreadCount: number };

    set((state) => ({
      unreadCount: Number(data.unreadCount ?? 0),
      items: state.items.map((item) => ({ ...item, isRead: true })),
    }));

    return true;
  },
  async deleteNotification(notificationId: string) {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { unreadCount: number };

    set((state) => ({
      unreadCount: Number(data.unreadCount ?? state.unreadCount),
      items: state.items.filter((item) => item.id !== notificationId),
    }));

    return true;
  },
}));
