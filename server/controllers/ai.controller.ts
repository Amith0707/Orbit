import type { Request, Response } from "express";
import { z } from "zod";
import * as buddyService from "../services/ai/buddy.service.js";
import * as eventPlannerService from "../services/ai/event-planner.service.js";
import * as iceBreakerService from "../services/ai/ice-breaker.service.js";
import * as communityRecsService from "../services/ai/community-recommendations.service.js";
import * as matchSuggestionsService from "../services/ai/match-suggestions.service.js";
import * as weeklyDigestService from "../services/ai/weekly-digest.service.js";
import { startSSE, sendSSEEvent } from "../utils/sse.js";
import { pathParam } from "../utils/params.js";

export async function handleListThreads(req: Request, res: Response) {
  const threads = await buddyService.listThreads(req.user!.id);
  res.json({ threads });
}

export async function handleCreateThread(req: Request, res: Response) {
  const thread = await buddyService.createThread(req.user!.id);
  res.status(201).json({ thread });
}

export async function handleGetThread(req: Request, res: Response) {
  const thread = await buddyService.getThread(req.user!.id, pathParam(req, "conversationId"));
  res.json({ thread });
}

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export async function handleSendMessage(req: Request, res: Response) {
  const { conversationId, message } = sendMessageSchema.parse(req.body);
  const userId = req.user!.id;

  startSSE(res);

  try {
    const result = await buddyService.streamReply(userId, conversationId, message, (delta) => {
      sendSSEEvent(res, "token", { delta });
    });
    sendSSEEvent(res, "done", { conversationId: result.conversationId, message: result.assistantMessage });
  } catch (err) {
    sendSSEEvent(res, "error", { message: err instanceof Error ? err.message : "Something went wrong" });
  } finally {
    res.end();
  }
}

const planEventSchema = z.object({
  idea: z.string().trim().min(5).max(1000),
  communityId: z.string().uuid().optional(),
});

export async function handlePlanEvent(req: Request, res: Response) {
  const input = planEventSchema.parse(req.body);
  const event = await eventPlannerService.planEvent(req.user!.id, input);
  res.status(201).json({ event });
}

const forceQuerySchema = z.object({ force: z.coerce.boolean().default(false) });

export async function handleIceBreaker(req: Request, res: Response) {
  const { force } = forceQuerySchema.parse(req.query);
  const result = await iceBreakerService.getIceBreaker(req.user!.id, pathParam(req, "userId"), force);
  res.json({ iceBreaker: result });
}

export async function handleCommunityRecommendations(req: Request, res: Response) {
  const { force } = forceQuerySchema.parse(req.query);
  const recommendations = await communityRecsService.getCommunityRecommendations(req.user!.id, force);
  res.json({ recommendations });
}

export async function handleDismissCommunityRecommendation(req: Request, res: Response) {
  await communityRecsService.dismissCommunityRecommendation(req.user!.id, pathParam(req, "communityId"));
  res.json({ success: true });
}

export async function handleMatchSuggestions(req: Request, res: Response) {
  const { force } = forceQuerySchema.parse(req.query);
  const suggestions = await matchSuggestionsService.getMatchSuggestions(req.user!.id, force);
  res.json({ suggestions });
}

export async function handleDismissMatchSuggestion(req: Request, res: Response) {
  await matchSuggestionsService.dismissMatchSuggestion(req.user!.id, pathParam(req, "userId"));
  res.json({ success: true });
}

export async function handleGetDigest(req: Request, res: Response) {
  const { force } = forceQuerySchema.parse(req.query);
  const digest = await weeklyDigestService.getOrGenerateWeeklyDigest(req.user!.id, force);
  res.json({ digest });
}

export async function handleDigestHistory(req: Request, res: Response) {
  const digests = await weeklyDigestService.getDigestHistory(req.user!.id);
  res.json({ digests });
}
