import { supabase, unwrap, unwrapCount, unwrapWithCount } from "../db/supabase-client.js";

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

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationRow> {
  const rows = unwrap(
    await supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link_url: input.linkUrl ?? null,
        metadata: input.metadata ?? null,
      })
      .select("*")
  ) as unknown as NotificationRow[];
  return rows[0];
}

export async function createNotificationsBulk(
  userIds: string[],
  input: { type: NotificationType; title: string; body?: string; linkUrl?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  if (userIds.length === 0) return;
  unwrap(
    await supabase.from("notifications").insert(
      userIds.map((userId) => ({
        user_id: userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link_url: input.linkUrl ?? null,
        metadata: input.metadata ?? null,
      }))
    )
  );
}

export async function listNotifications(
  userId: string,
  filters: { unreadOnly?: boolean; limit: number; offset: number }
): Promise<{ rows: NotificationRow[]; total: number; unreadCount: number }> {
  let rowsQuery = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);
  if (filters.unreadOnly) rowsQuery = rowsQuery.eq("is_read", false);

  const { rows, count } = unwrapWithCount(await rowsQuery) as { rows: NotificationRow[]; count: number };

  const unreadCount = unwrapCount(
    await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)
  );

  return { rows, total: count, unreadCount };
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  unwrap(
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("user_id", userId)
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  unwrap(
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
  );
}
