import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as notificationsService from "../services/notifications.service.js";

const listQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function handleList(req: Request, res: Response) {
  const filters = listQuerySchema.parse(req.query);
  const result = await notificationsService.getNotifications(req.user!.id, filters);
  res.json(result);
}

export async function handleMarkRead(req: Request, res: Response) {
  await notificationsService.markRead(req.user!.id, pathParam(req, "notificationId"));
  res.json({ success: true });
}

export async function handleMarkAllRead(req: Request, res: Response) {
  await notificationsService.markAllRead(req.user!.id);
  res.json({ success: true });
}
