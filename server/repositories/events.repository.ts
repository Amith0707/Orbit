import { supabase, unwrap } from "../db/supabase-client.js";

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

type RpcEventRow = Omit<EventRow, "estimated_cost"> & {
  estimated_cost: number | null;
  participant_count: number;
  viewer_rsvp_status: string | null;
  community_name: string | null;
  total_count?: number;
};

function toEventWithStats(row: RpcEventRow): EventWithStats {
  return {
    ...row,
    estimated_cost: row.estimated_cost === null ? null : String(row.estimated_cost),
    participant_count: String(row.participant_count),
  };
}

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
  const rows = unwrap(
    await supabase
      .from("events")
      .insert({
        community_id: input.communityId ?? null,
        created_by: input.createdBy,
        title: input.title,
        description: input.description,
        location: input.location ?? null,
        starts_at: input.startsAt.toISOString(),
        ends_at: input.endsAt?.toISOString() ?? null,
        duration_minutes: input.durationMinutes ?? null,
        estimated_cost: input.estimatedCost ?? null,
        ideal_group_size_min: input.idealGroupSizeMin ?? null,
        ideal_group_size_max: input.idealGroupSizeMax ?? null,
        capacity: input.capacity ?? null,
        agenda: input.agenda ?? null,
        things_to_bring: input.thingsToBring ?? null,
        source: input.source ?? "manual",
        ai_raw_response: input.aiRawResponse ?? null,
      })
      .select("*")
  ) as unknown as (Omit<EventRow, "estimated_cost"> & { estimated_cost: number | null })[];
  const row = rows[0];
  return { ...row, estimated_cost: row.estimated_cost === null ? null : String(row.estimated_cost) };
}

export async function findEventById(id: string, viewerId: string): Promise<EventWithStats | null> {
  const rows = unwrap(
    await supabase.rpc("find_event_by_id", { p_event_id: id, p_viewer_id: viewerId })
  ) as RpcEventRow[];
  return rows[0] ? toEventWithStats(rows[0]) : null;
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

export async function listEvents(filters: ListEventsFilters): Promise<{ rows: EventWithStats[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("list_events", {
      p_viewer_id: filters.viewerId,
      p_community_id: filters.communityId ?? null,
      p_upcoming_only: filters.upcomingOnly ?? false,
      p_joined_only: filters.joinedOnly ?? false,
      p_search: filters.search ? `%${filters.search.toLowerCase()}%` : null,
      p_limit: filters.limit,
      p_offset: filters.offset,
    })
  ) as (RpcEventRow & { total_count: number })[];

  return { rows: rows.map(toEventWithStats), total: rows[0]?.total_count ?? 0 };
}

export async function upsertRsvp(eventId: string, userId: string, status: "going" | "interested" | "declined"): Promise<void> {
  unwrap(
    await supabase
      .from("event_participants")
      .upsert({ event_id: eventId, user_id: userId, rsvp_status: status }, { onConflict: "event_id,user_id" })
  );
}

export async function removeRsvp(eventId: string, userId: string): Promise<void> {
  unwrap(await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", userId));
}

export interface ParticipantRow {
  user_id: string;
  rsvp_status: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export async function listParticipants(eventId: string): Promise<ParticipantRow[]> {
  const rows = unwrap(
    await supabase
      .from("event_participants")
      .select("user_id, rsvp_status, created_at, user:users(first_name, last_name, avatar_url)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
  ) as unknown as {
    user_id: string;
    rsvp_status: string;
    user: { first_name: string; last_name: string; avatar_url: string | null };
  }[];

  return rows.map((r) => ({
    user_id: r.user_id,
    rsvp_status: r.rsvp_status,
    first_name: r.user.first_name,
    last_name: r.user.last_name,
    avatar_url: r.user.avatar_url,
  }));
}

export async function listUpcomingForUser(userId: string, limit: number): Promise<EventWithStats[]> {
  const rows = unwrap(
    await supabase.rpc("list_upcoming_events_for_user", { p_user_id: userId, p_limit: limit })
  ) as RpcEventRow[];
  return rows.map(toEventWithStats);
}
