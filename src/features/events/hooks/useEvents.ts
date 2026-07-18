import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/events";
import type { RsvpStatus } from "../api/events";

export function useEvents(params: Parameters<typeof api.listEvents>[0] = {}) {
  return useQuery({ queryKey: ["events", "list", params], queryFn: () => api.listEvents(params) });
}

export function useEvent(eventId: string) {
  return useQuery({ queryKey: ["events", eventId], queryFn: () => api.getEvent(eventId), enabled: !!eventId });
}

export function useEventParticipants(eventId: string) {
  return useQuery({ queryKey: ["events", eventId, "participants"], queryFn: () => api.listParticipants(eventId), enabled: !!eventId });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
}

function updateEventCaches(queryClient: ReturnType<typeof useQueryClient>, updated: api.EventItem) {
  queryClient.setQueryData(["events", updated.id], updated);
  queryClient.invalidateQueries({ queryKey: ["events", "list"] });
}

export function useRsvpToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: RsvpStatus }) => api.rsvpToEvent(eventId, status),
    onSuccess: (updated) => updateEventCaches(queryClient, updated),
  });
}

export function useRemoveRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeRsvp,
    onSuccess: (updated) => updateEventCaches(queryClient, updated),
  });
}
