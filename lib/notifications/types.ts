export interface NotificationItem {
  id: string;
  eventId: string;
  eventType: string;
  title: string;
  summary: string;
  href?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationListResult {
  items: NotificationItem[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationSyncResult {
  items: NotificationItem[];
  nextSinceEventId: string | null;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationPushEvent {
  eventId: string;
  notificationId: string;
  eventType: string;
  title: string;
  summary: string;
  href?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  unreadCount: number;
}

export interface NotificationUnreadCountEvent {
  unreadCount: number;
}

export interface NotificationDeletedEvent {
  notificationId: string;
  unreadCount: number;
}
