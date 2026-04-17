export interface NotificationItem {
  id: string;
  eventId: string;
  title: string;
  summary: string;
  href?: string;
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
  title: string;
  summary: string;
  href?: string;
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
