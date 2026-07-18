import { listUpcomingForUser } from "../../events.service.js";
import type { ToolDefinition } from "../provider.js";

export const definition: ToolDefinition = {
  name: "get_upcoming_events",
  description:
    "Get upcoming events the employee is attending or that are happening in communities they belong to. Use this when the user asks about events, weekend plans, or things to do.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

export async function handler(userId: string) {
  const events = await listUpcomingForUser(userId, 8);
  return events.map((e) => ({
    title: e.title,
    description: e.description,
    communityName: e.communityName,
    startsAt: e.startsAt,
    location: e.location,
    viewerRsvpStatus: e.viewerRsvpStatus,
  }));
}
