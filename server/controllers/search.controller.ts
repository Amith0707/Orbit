import type { Request, Response } from "express";
import { z } from "zod";
import { globalSearch } from "../services/search.service.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(160),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export async function handleSearch(req: Request, res: Response) {
  const { q, limit } = searchQuerySchema.parse(req.query);
  const results = await globalSearch(q, limit);
  res.json({ results });
}
