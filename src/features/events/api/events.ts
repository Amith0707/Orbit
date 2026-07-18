import { api } from "@/lib/http/apiClient";

export type RsvpStatus = "going" | "interested" | "declined";

export interface EventItem {
  id: string;
  communityId: string | null;
  communityName: string | null;
  title: string;
  description: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  estimatedCost: number | null;
  idealGroupSizeMin: number | null;
  idealGroupSizeMax: number | null;
  capacity: number | null;
  agenda: string[];
  thingsToBring: string[];
  source: "manual" | "ai_planner";
  status: "scheduled" | "cancelled" | "completed";
  participantCount: number;
  viewerRsvpStatus: RsvpStatus | null;
  createdAt: string;
}

export async function listEvents(params: {
  communityId?: string;
  upcomingOnly?: boolean;
  joinedOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<{ events: EventItem[]; total: number }>("/events", { params });
  return data;
}

export async function getEvent(eventId: string): Promise<EventItem> {
  const { data } = await api.get<{ event: EventItem }>(`/events/${eventId}`);
  return data.event;
}

export interface CreateEventInput {
  communityId?: string | null;
  title: string;
  description: string;
  location?: string;
  startsAt: string;
  durationMinutes?: number;
  estimatedCost?: number;
  idealGroupSizeMin?: number;
  idealGroupSizeMax?: number;
  capacity?: number;
}

export async function createEvent(input: CreateEventInput): Promise<EventItem> {
  const { data } = await api.post<{ event: EventItem }>("/events", input);
  return data.event;
}

export async function rsvpToEvent(eventId: string, status: RsvpStatus): Promise<EventItem> {
  const { data } = await api.post<{ event: EventItem }>(`/events/${eventId}/rsvp`, { status });
  return data.event;
}

export async function removeRsvp(eventId: string): Promise<EventItem> {
  const { data } = await api.delete<{ event: EventItem }>(`/events/${eventId}/rsvp`);
  return data.event;
}

export interface Participant {
  userId: string;
  rsvpStatus: RsvpStatus;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export async function listParticipants(eventId: string): Promise<Participant[]> {
  const { data } = await api.get<{ participants: Participant[] }>(`/events/${eventId}/participants`);
  return data.participants;
}
