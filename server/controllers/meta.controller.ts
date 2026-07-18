import type { Request, Response } from "express";
import { z } from "zod";
import { listTags, findOrCreateTag } from "../repositories/tags.repository.js";
import { listDepartments } from "../services/users.service.js";

const tagsQuerySchema = z.object({
  kind: z.enum(["interest", "hobby", "skill"]).optional(),
});

const createTagSchema = z.object({
  kind: z.enum(["interest", "hobby", "skill"]),
  name: z.string().trim().min(1).max(60),
});

export async function handleListTags(req: Request, res: Response) {
  const { kind } = tagsQuerySchema.parse(req.query);
  const tags = await listTags(kind);
  res.json({ tags });
}

export async function handleCreateTag(req: Request, res: Response) {
  const { kind, name } = createTagSchema.parse(req.body);
  const tag = await findOrCreateTag(kind, name);
  res.status(201).json({ tag });
}

export async function handleListDepartmentsMeta(_req: Request, res: Response) {
  const departments = await listDepartments();
  res.json({ departments });
}
