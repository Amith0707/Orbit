import * as eventsRepo from "../repositories/events.repository.js";
import * as communitiesService from "./communities.service.js";
import { notifyUsers, notifyUser } from "./notifications.service.js";
import { listCommunityMembers } from "../repositories/communities.repository.js";
import { AppError } from "../utils/app-error.js";
import type { EventRow, EventWithStats } from "../repositories/events.repository.js";

export function toEventDTO(row: EventRow | EventWithStats) {
  const withStats = row as EventWithStats;
  return {
    id: row.id,
    communityId: row.community_id,
    communityName: withStats.community_name ?? null,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    estimatedCost: row.estimated_cost ? Number.parseFloat(row.estimated_cost) : null,
    idealGroupSizeMin: row.ideal_group_size_min,
    idealGroupSizeMax: row.ideal_group_size_max,
    capacity: row.capacity,
    agenda: row.agenda ?? [],
    thingsToBring: row.things_to_bring ?? [],
    source: row.source,
    status: row.status,
    participantCount: withStats.participant_count ? Number.parseInt(withStats.participant_count, 10) : 0,
    viewerRsvpStatus: withStats.viewer_rsvp_status ?? null,
    createdAt: row.created_at,
  };
}

export interface CreateEventInput {
  communityId?: string | null;
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
}

export async function createEvent(userId: string, input: CreateEventInput) {
  if (input.communityId) {
    await communitiesService.requireMembership(input.communityId, userId);
  }

  const event = await eventsRepo.createEvent({ ...input, createdBy: userId });
  await eventsRepo.upsertRsvp(event.id, userId, "going");

  if (input.communityId) {
    const members = await listCommunityMembers(input.communityId);
    await notifyUsers(
      members.map((m) => m.user_id).filter((id) => id !== userId),
      { type: "event_rsvp", title: `New event: ${event.title}`, linkUrl: `/events/${event.id}` }
    );
  }

  const full = await eventsRepo.findEventById(event.id, userId);
  return toEventDTO(full!);
}

export async function listEvents(input: {
  viewerId: string;
  communityId?: string;
  upcomingOnly?: boolean;
  joinedOnly?: boolean;
  search?: string;
  limit: number;
  offset: number;
}) {
  const { rows, total } = await eventsRepo.listEvents(input);
  return { events: rows.map(toEventDTO), total };
}

export async function getEvent(eventId: string, viewerId: string) {
  const event = await eventsRepo.findEventById(eventId, viewerId);
  if (!event) throw AppError.notFound("Event not found");
  return toEventDTO(event);
}

export async function rsvp(eventId: string, userId: string, status: "going" | "interested" | "declined") {
  const event = await eventsRepo.findEventById(eventId, userId);
  if (!event) throw AppError.notFound("Event not found");
  if (event.community_id) {
    await communitiesService.requireMembership(event.community_id, userId);
  }
  await eventsRepo.upsertRsvp(eventId, userId, status);

  if (event.created_by && event.created_by !== userId && status === "going") {
    await notifyUser({
      userId: event.created_by,
      type: "event_rsvp",
      title: "New RSVP to your event",
      body: `Someone is going to "${event.title}"`,
      linkUrl: `/events/${eventId}`,
    });
  }

  const updated = await eventsRepo.findEventById(eventId, userId);
  return toEventDTO(updated!);
}

export async function removeRsvp(eventId: string, userId: string) {
  await eventsRepo.removeRsvp(eventId, userId);
  const updated = await eventsRepo.findEventById(eventId, userId);
  if (!updated) throw AppError.notFound("Event not found");
  return toEventDTO(updated);
}

export async function getParticipants(eventId: string) {
  const participants = await eventsRepo.listParticipants(eventId);
  return participants.map((p) => ({
    userId: p.user_id,
    rsvpStatus: p.rsvp_status,
    firstName: p.first_name,
    lastName: p.last_name,
    avatarUrl: p.avatar_url,
  }));
}

export async function listUpcomingForUser(userId: string, limit = 5) {
  const rows = await eventsRepo.listUpcomingForUser(userId, limit);
  return rows.map(toEventDTO);
}
