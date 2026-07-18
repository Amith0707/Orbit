import { api } from "@/lib/http/apiClient";
import type { EventItem } from "@/features/events/api/events";

export async function planEvent(input: { idea: string; communityId?: string }): Promise<EventItem> {
  const { data } = await api.post<{ event: EventItem }>("/ai/event-planner", input);
  return data.event;
}
