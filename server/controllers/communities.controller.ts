import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as communitiesService from "../services/communities.service.js";

export const createCommunitySchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional(),
  coverImageUrl: z.string().url().optional(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
});

const listQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  joinedOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function handleCreate(req: Request, res: Response) {
  const input = createCommunitySchema.parse(req.body);
  const community = await communitiesService.createCommunity({ ...input, createdBy: req.user!.id });
  res.status(201).json({ community });
}

export async function handleList(req: Request, res: Response) {
  const filters = listQuerySchema.parse(req.query);
  const result = await communitiesService.listCommunities({ ...filters, viewerId: req.user!.id });
  res.json(result);
}

export async function handleListMine(req: Request, res: Response) {
  const communities = await communitiesService.listMyCommunities(req.user!.id);
  res.json({ communities });
}

export async function handleGetBySlug(req: Request, res: Response) {
  const community = await communitiesService.getCommunityBySlug(pathParam(req, "slug"), req.user!.id);
  res.json({ community });
}

export async function handleJoin(req: Request, res: Response) {
  const community = await communitiesService.joinCommunity(pathParam(req, "slug"), req.user!.id);
  res.json({ community });
}

export async function handleLeave(req: Request, res: Response) {
  await communitiesService.leaveCommunity(pathParam(req, "slug"), req.user!.id);
  res.json({ success: true });
}

export async function handleMembers(req: Request, res: Response) {
  const members = await communitiesService.getMembers(pathParam(req, "slug"));
  res.json({ members });
}
