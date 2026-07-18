import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as pollsService from "../services/polls.service.js";
import { closePollWithSummary } from "../services/ai/poll-summary.service.js";

export const createPollSchema = z.object({
  question: z.string().trim().min(3).max(300),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
  allowMultipleChoices: z.boolean().default(false),
  closesAt: z.coerce.date().optional(),
});

const voteSchema = z.object({
  optionIds: z.array(z.string().uuid()).min(1),
});

export async function handleCreatePoll(req: Request, res: Response) {
  const input = createPollSchema.parse(req.body);
  const poll = await pollsService.createPoll(pathParam(req, "slug"), req.user!.id, input);
  res.status(201).json({ poll });
}

export async function handleGetPoll(req: Request, res: Response) {
  const poll = await pollsService.getResultsByPostId(pathParam(req, "postId"), req.user!.id);
  res.json({ poll });
}

export async function handleVote(req: Request, res: Response) {
  const { optionIds } = voteSchema.parse(req.body);
  const poll = await pollsService.vote(pathParam(req, "postId"), req.user!.id, optionIds);
  res.json({ poll });
}

export async function handleClosePoll(req: Request, res: Response) {
  const poll = await closePollWithSummary(pathParam(req, "postId"), req.user!.id);
  res.json({ poll });
}
