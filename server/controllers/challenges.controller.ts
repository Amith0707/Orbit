import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as challengesService from "../services/challenges.service.js";
import { generateChallenge } from "../services/ai/challenge-generator.service.js";

export const createChallengeSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(3).max(2000),
  goalMetric: z.string().trim().max(120).optional(),
  goalTarget: z.number().positive().optional(),
  startsAt: z.string().date(),
  endsAt: z.string().date(),
});

export async function handleCreate(req: Request, res: Response) {
  const input = createChallengeSchema.parse(req.body);
  const challenge = await challengesService.createChallenge(pathParam(req, "slug"), req.user!.id, input);
  res.status(201).json({ challenge });
}

export async function handleList(req: Request, res: Response) {
  const challenges = await challengesService.listChallenges(pathParam(req, "slug"));
  res.json({ challenges });
}

export async function handleGenerate(req: Request, res: Response) {
  const challenge = await generateChallenge(pathParam(req, "slug"), req.user!.id);
  res.status(201).json({ challenge });
}

export async function handleJoin(req: Request, res: Response) {
  const challenge = await challengesService.joinChallenge(pathParam(req, "challengeId"), req.user!.id);
  res.json({ challenge });
}

export async function handlePublish(req: Request, res: Response) {
  const challenge = await challengesService.publishChallenge(pathParam(req, "challengeId"), req.user!.id);
  res.json({ challenge });
}
