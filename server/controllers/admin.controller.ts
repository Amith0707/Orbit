import type { Request, Response } from "express";
import { z } from "zod";
import { pathParam } from "../utils/params.js";
import * as adminService from "../services/admin.service.js";
import * as postsService from "../services/posts.service.js";

const listUsersQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  role: z.enum(["employee", "administrator"]).optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function handleListUsers(req: Request, res: Response) {
  const filters = listUsersQuerySchema.parse(req.query);
  const result = await adminService.adminListUsers(filters);
  res.json(result);
}

const setRoleSchema = z.object({ role: z.enum(["employee", "administrator"]) });

export async function handleSetUserRole(req: Request, res: Response) {
  const { role } = setRoleSchema.parse(req.body);
  const user = await adminService.adminSetUserRole(pathParam(req, "userId"), req.user!.id, role);
  res.json({ user });
}

const setActiveSchema = z.object({ isActive: z.boolean() });

export async function handleSetUserActive(req: Request, res: Response) {
  const { isActive } = setActiveSchema.parse(req.body);
  const user = await adminService.adminSetUserActive(pathParam(req, "userId"), req.user!.id, isActive);
  res.json({ user });
}

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function handleListCommunities(req: Request, res: Response) {
  const { limit, offset } = listQuerySchema.parse(req.query);
  const result = await adminService.adminListCommunitiesWithStats(limit, offset);
  res.json(result);
}

const setArchivedSchema = z.object({ isArchived: z.boolean() });

export async function handleSetCommunityArchived(req: Request, res: Response) {
  const { isArchived } = setArchivedSchema.parse(req.body);
  const community = await adminService.adminSetCommunityArchived(pathParam(req, "communityId"), isArchived);
  res.json({ community });
}

export async function handleListModerationPosts(req: Request, res: Response) {
  const { limit, offset } = listQuerySchema.parse(req.query);
  const result = await adminService.adminListRecentPostsForModeration(limit, offset);
  res.json(result);
}

export async function handleModerationDeletePost(req: Request, res: Response) {
  await postsService.deletePost(pathParam(req, "postId"), req.user!.id, "administrator");
  res.json({ success: true });
}
