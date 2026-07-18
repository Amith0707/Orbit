import { query } from "../db/client.js";

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
  const result = await query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, title, body, link_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.userId, input.type, input.title, input.body ?? null, input.linkUrl ?? null, input.metadata ?? null]
  );
  return result.rows[0];
}

export async function createNotificationsBulk(
  userIds: string[],
  input: { type: NotificationType; title: string; body?: string; linkUrl?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  if (userIds.length === 0) return;
  const values: string[] = [];
  const params: unknown[] = [];
  userIds.forEach((userId, i) => {
    const base = i * 6;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
    params.push(userId, input.type, input.title, input.body ?? null, input.linkUrl ?? null, input.metadata ?? null);
  });
  await query(
    `INSERT INTO notifications (user_id, type, title, body, link_url, metadata) VALUES ${values.join(", ")}`,
    params
  );
}

export async function listNotifications(
  userId: string,
  filters: { unreadOnly?: boolean; limit: number; offset: number }
): Promise<{ rows: NotificationRow[]; total: number; unreadCount: number }> {
  const conditions = [`user_id = $1`];
  const params: unknown[] = [userId];
  if (filters.unreadOnly) conditions.push(`is_read = false`);
  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const [rowsResult, countResult, unreadResult] = await Promise.all([
    query<NotificationRow>(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, filters.limit, filters.offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) FROM notifications ${whereClause}`, params),
    query<{ count: string }>(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number.parseInt(countResult.rows[0].count, 10),
    unreadCount: Number.parseInt(unreadResult.rows[0].count, 10),
  };
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
}
