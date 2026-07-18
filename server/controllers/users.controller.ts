import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as usersService from "../services/users.service.js";
import { publicUploadUrl } from "../middleware/upload.js";
import { AppError } from "../utils/app-error.js";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().trim().max(160).nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  availability: z.string().trim().max(160).nullable().optional(),
  tagIds: z.array(z.string().uuid()).max(40).optional(),
});

export const directoryQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  departmentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function handleGetMe(req: Request, res: Response) {
  const profile = await usersService.getProfile(req.user!.id);
  res.json({ profile });
}

export async function handleUpdateMe(req: Request, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  const profile = await usersService.updateProfile(req.user!.id, input);
  res.json({ profile });
}

export async function handleUploadAvatar(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest("No image uploaded");
  const avatarUrl = publicUploadUrl(req.file.filename);
  const profile = await usersService.updateProfile(req.user!.id, { avatarUrl });
  res.json({ profile });
}

export async function handleGetUserById(req: Request, res: Response) {
  const profile = await usersService.getProfile(pathParam(req, "userId"));
  res.json({ profile });
}

export async function handleListDirectory(req: Request, res: Response) {
  const filters = directoryQuerySchema.parse(req.query);
  const result = await usersService.listDirectory(filters);
  res.json(result);
}

export async function handleListDepartments(_req: Request, res: Response) {
  const departments = await usersService.listDepartments();
  res.json({ departments });
}
