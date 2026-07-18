import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as eventsService from "../services/events.service.js";

export const createEventSchema = z.object({
  communityId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(3000),
  location: z.string().trim().max(300).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().positive().max(24 * 60).optional(),
  estimatedCost: z.number().min(0).optional(),
  idealGroupSizeMin: z.number().int().positive().optional(),
  idealGroupSizeMax: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  agenda: z.array(z.string().trim().min(1)).max(20).optional(),
  thingsToBring: z.array(z.string().trim().min(1)).max(20).optional(),
});

const listQuerySchema = z.object({
  communityId: z.string().uuid().optional(),
  upcomingOnly: z.coerce.boolean().default(true),
  joinedOnly: z.coerce.boolean().optional(),
  search: z.string().trim().max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const rsvpSchema = z.object({
  status: z.enum(["going", "interested", "declined"]),
});

export async function handleCreate(req: Request, res: Response) {
  const input = createEventSchema.parse(req.body);
  const event = await eventsService.createEvent(req.user!.id, input);
  res.status(201).json({ event });
}

export async function handleList(req: Request, res: Response) {
  const filters = listQuerySchema.parse(req.query);
  const result = await eventsService.listEvents({ ...filters, viewerId: req.user!.id });
  res.json(result);
}

export async function handleGet(req: Request, res: Response) {
  const event = await eventsService.getEvent(pathParam(req, "eventId"), req.user!.id);
  res.json({ event });
}

export async function handleRsvp(req: Request, res: Response) {
  const { status } = rsvpSchema.parse(req.body);
  const event = await eventsService.rsvp(pathParam(req, "eventId"), req.user!.id, status);
  res.json({ event });
}

export async function handleRemoveRsvp(req: Request, res: Response) {
  const event = await eventsService.removeRsvp(pathParam(req, "eventId"), req.user!.id);
  res.json({ event });
}

export async function handleParticipants(req: Request, res: Response) {
  const participants = await eventsService.getParticipants(pathParam(req, "eventId"));
  res.json({ participants });
}
