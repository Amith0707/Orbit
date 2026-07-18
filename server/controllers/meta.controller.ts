import type { Request, Response } from "express";
import { z } from "zod";
import { listTags } from "../repositories/tags.repository.js";
import { listDepartments } from "../services/users.service.js";

const tagsQuerySchema = z.object({
  kind: z.enum(["interest", "hobby", "skill"]).optional(),
});

export async function handleListTags(req: Request, res: Response) {
  const { kind } = tagsQuerySchema.parse(req.query);
  const tags = await listTags(kind);
  res.json({ tags });
}

export async function handleListDepartmentsMeta(_req: Request, res: Response) {
  const departments = await listDepartments();
  res.json({ departments });
}
