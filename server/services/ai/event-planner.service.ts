import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import * as eventsService from "../events.service.js";
import { findCommunityById } from "../../repositories/communities.repository.js";
import { requireMembership } from "../communities.service.js";

const eventPlanSchema = z.object({
  title: z.string().min(3).max(150).describe("A catchy, specific event title"),
  description: z.string().min(10).max(1000).describe("A friendly 2-4 sentence description of the event"),
  startsAt: z.string().describe("ISO 8601 datetime (with timezone offset) for when the event should start"),
  durationMinutes: z.number().int().positive().max(600),
  estimatedCost: z.number().min(0).max(100000).describe("Estimated cost per person in US dollars"),
  idealGroupSizeMin: z.number().int().positive(),
  idealGroupSizeMax: z.number().int().positive(),
  venueSuggestion: z
    .string()
    .min(3)
    .max(200)
    .describe("A generic type of venue (e.g. 'a nearby bowling alley' or 'the office rooftop'), never a specific real business name or address"),
  thingsToBring: z.array(z.string().min(1).max(80)).max(10),
  agenda: z.array(z.string().min(1).max(150)).max(10).describe("Ordered list of agenda items with rough timing"),
});

export type EventPlan = z.infer<typeof eventPlanSchema>;

function fallbackStartsAt(): Date {
  // If the model's date math is unusable, default to this coming Saturday at 6pm.
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const fallback = new Date(now);
  fallback.setDate(now.getDate() + daysUntilSaturday);
  fallback.setHours(18, 0, 0, 0);
  return fallback;
}

export async function planEvent(
  userId: string,
  input: { idea: string; communityId?: string }
): Promise<ReturnType<typeof eventsService.createEvent>> {
  if (input.communityId) {
    const community = await findCommunityById(input.communityId);
    if (community) await requireMembership(community.id, userId);
  }

  const now = new Date();
  const plan = await aiProvider.generateStructured({
    schema: eventPlanSchema,
    schemaName: "event_plan",
    system: [
      "You are the AI Event Planner inside Calfus Orbit, an employee community platform.",
      "Turn the employee's casual event idea into a concrete, realistic plan for a workplace social event.",
      `The current date and time is ${now.toISOString()}. Always choose a startsAt that is clearly in the future — pick a sensible upcoming date/time consistent with any day mentioned (e.g. "Saturday evening").`,
      "Suggest only generic venue types or descriptions (e.g. a category of place), never a real named business, brand, or exact address.",
      "Keep the group size and cost estimate realistic for a casual coworker social event.",
    ].join("\n"),
    prompt: input.idea,
    temperature: 0.7,
  });

  let startsAt = new Date(plan.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= now.getTime()) {
    startsAt = fallbackStartsAt();
  }

  return eventsService.createEvent(userId, {
    communityId: input.communityId ?? null,
    title: plan.title,
    description: plan.description,
    location: plan.venueSuggestion,
    startsAt,
    durationMinutes: plan.durationMinutes,
    estimatedCost: plan.estimatedCost,
    idealGroupSizeMin: plan.idealGroupSizeMin,
    idealGroupSizeMax: plan.idealGroupSizeMax,
    agenda: plan.agenda,
    thingsToBring: plan.thingsToBring,
    source: "ai_planner",
    aiRawResponse: plan,
  });
}
