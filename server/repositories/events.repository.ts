import { query } from "../db/client.js";

export interface EventRow {
  id: string;
  community_id: string | null;
  created_by: string | null;
  title: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  duration_minutes: number | null;
  estimated_cost: string | null;
  ideal_group_size_min: number | null;
  ideal_group_size_max: number | null;
  capacity: number | null;
  agenda: string[] | null;
  things_to_bring: string[] | null;
  source: "manual" | "ai_planner";
  ai_raw_response: Record<string, unknown> | null;
  status: "scheduled" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface EventWithStats extends EventRow {
  participant_count: string;
  viewer_rsvp_status: string | null;
  community_name: string | null;
}

const EVENT_SELECT = `
  SELECT e.*,
    (SELECT COUNT(*) FROM event_participants p WHERE p.event_id = e.id AND p.rsvp_status = 'going') AS participant_count,
    (SELECT p.rsvp_status FROM event_participants p WHERE p.event_id = e.id AND p.user_id = $1) AS viewer_rsvp_status,
    c.name AS community_name
  FROM events e
  LEFT JOIN communities c ON c.id = e.community_id
`;

export async function createEvent(input: {
  communityId?: string | null;
  createdBy: string;
  title: string;
  description: string;
  location?: string;
  startsAt: Date;
  endsAt?: Date;
  durationMinutes?: number;
  estimatedCost?: number;
  idealGroupSizeMin?: number;
  idealGroupSizeMax?: number;
  capacity?: number;
  agenda?: string[];
  thingsToBring?: string[];
  source?: "manual" | "ai_planner";
  aiRawResponse?: Record<string, unknown>;
}): Promise<EventRow> {
  const result = await query<EventRow>(
    `INSERT INTO events (
       community_id, created_by, title, description, location, starts_at, ends_at, duration_minutes,
       estimated_cost, ideal_group_size_min, ideal_group_size_max, capacity, agenda, things_to_bring, source, ai_raw_response
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      input.communityId ?? null,
      input.createdBy,
      input.title,
      input.description,
      input.location ?? null,
      input.startsAt,
      input.endsAt ?? null,
      input.durationMinutes ?? null,
      input.estimatedCost ?? null,
      input.idealGroupSizeMin ?? null,
      input.idealGroupSizeMax ?? null,
      input.capacity ?? null,
      input.agenda ? JSON.stringify(input.agenda) : null,
      input.thingsToBring ? JSON.stringify(input.thingsToBring) : null,
      input.source ?? "manual",
      input.aiRawResponse ? JSON.stringify(input.aiRawResponse) : null,
    ]
  );
  return result.rows[0];
}

export async function findEventById(id: string, viewerId: string): Promise<EventWithStats | null> {
  const result = await query<EventWithStats>(`${EVENT_SELECT} WHERE e.id = $2`, [viewerId, id]);
  return result.rows[0] ?? null;
}

export interface ListEventsFilters {
  viewerId: string;
  communityId?: string;
  upcomingOnly?: boolean;
  joinedOnly?: boolean;
  search?: string;
  limit: number;
  offset: number;
}

function buildEventConditions(filters: ListEventsFilters, params: unknown[], viewerParamIndex: number) {
  const conditions = [`e.status != 'cancelled'`];

  if (filters.upcomingOnly) conditions.push(`e.starts_at >= now()`);
  if (filters.communityId) {
    params.push(filters.communityId);
    conditions.push(`e.community_id = $${params.length}`);
  }
  if (filters.joinedOnly) {
    conditions.push(
      `EXISTS (SELECT 1 FROM event_participants p WHERE p.event_id = e.id AND p.user_id = $${viewerParamIndex})`
    );
  }
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(`LOWER(e.title) LIKE $${params.length}`);
  }

  return conditions;
}

export async function listEvents(filters: ListEventsFilters): Promise<{ rows: EventWithStats[]; total: number }> {
  // The count query has no reason to know the viewer unless joinedOnly filters on them —
  // only push viewerId into its params when a condition actually references it.
  const countParams: unknown[] = filters.joinedOnly ? [filters.viewerId] : [];
  const countConditions = buildEventConditions(filters, countParams, 1);
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM events e WHERE ${countConditions.join(" AND ")}`,
    countParams
  );

  // The row query always needs viewerId at $1 for EVENT_SELECT's viewer-scoped subqueries.
  const rowParams: unknown[] = [filters.viewerId];
  const rowConditions = buildEventConditions(filters, rowParams, 1);
  rowParams.push(filters.limit, filters.offset);
  const rowsResult = await query<EventWithStats>(
    `${EVENT_SELECT} WHERE ${rowConditions.join(" AND ")} ORDER BY e.starts_at ASC LIMIT $${rowParams.length - 1} OFFSET $${rowParams.length}`,
    rowParams
  );

  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function upsertRsvp(eventId: string, userId: string, status: "going" | "interested" | "declined"): Promise<void> {
  await query(
    `INSERT INTO event_participants (event_id, user_id, rsvp_status) VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET rsvp_status = EXCLUDED.rsvp_status`,
    [eventId, userId, status]
  );
}

export async function removeRsvp(eventId: string, userId: string): Promise<void> {
  await query(`DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2`, [eventId, userId]);
}

export interface ParticipantRow {
  user_id: string;
  rsvp_status: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export async function listParticipants(eventId: string): Promise<ParticipantRow[]> {
  const result = await query<ParticipantRow>(
    `SELECT p.user_id, p.rsvp_status, u.first_name, u.last_name, u.avatar_url
     FROM event_participants p JOIN users u ON u.id = p.user_id
     WHERE p.event_id = $1 ORDER BY p.created_at ASC`,
    [eventId]
  );
  return result.rows;
}

export async function listUpcomingForUser(userId: string, limit: number): Promise<EventWithStats[]> {
  const result = await query<EventWithStats>(
    `${EVENT_SELECT}
     WHERE e.status = 'scheduled' AND e.starts_at >= now()
       AND (
         EXISTS (SELECT 1 FROM event_participants p WHERE p.event_id = e.id AND p.user_id = $1)
         OR e.community_id IN (SELECT community_id FROM community_members WHERE user_id = $1)
       )
     ORDER BY e.starts_at ASC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
