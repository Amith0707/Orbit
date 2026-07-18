import { api } from "@/lib/http/apiClient";

export type NotificationType =
  | "post_reaction"
  | "post_comment"
  | "event_reminder"
  | "event_rsvp"
  | "community_invite"
  | "poll_new"
  | "poll_closed"
  | "match_suggestion"
  | "digest_ready"
  | "mention"
  | "challenge_new";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

interface ListNotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

export async function listNotifications(params: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) {
  const { data } = await api.get<ListNotificationsResponse>("/notifications", { params });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}
