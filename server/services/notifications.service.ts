import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  createNotificationsBulk,
  type NotificationType,
} from "../repositories/notifications.repository.js";

function toDTO(row: Awaited<ReturnType<typeof listNotifications>>["rows"][number]) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    metadata: row.metadata,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getNotifications(userId: string, filters: { unreadOnly?: boolean; limit: number; offset: number }) {
  const { rows, total, unreadCount } = await listNotifications(userId, filters);
  return { notifications: rows.map(toDTO), total, unreadCount };
}

export async function markRead(userId: string, notificationId: string) {
  await markNotificationRead(userId, notificationId);
}

export async function markAllRead(userId: string) {
  await markAllNotificationsRead(userId);
}

export async function notifyUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  return createNotification(input);
}

export async function notifyUsers(
  userIds: string[],
  input: { type: NotificationType; title: string; body?: string; linkUrl?: string; metadata?: Record<string, unknown> }
) {
  return createNotificationsBulk(userIds, input);
}
