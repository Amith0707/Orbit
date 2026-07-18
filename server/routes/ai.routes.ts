import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleListThreads,
  handleCreateThread,
  handleGetThread,
  handleSendMessage,
  handlePlanEvent,
  handleIceBreaker,
  handleCommunityRecommendations,
  handleDismissCommunityRecommendation,
  handleMatchSuggestions,
  handleDismissMatchSuggestion,
  handleGetDigest,
  handleDigestHistory,
} from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get("/buddy/threads", asyncHandler(handleListThreads));
aiRouter.post("/buddy/threads", asyncHandler(handleCreateThread));
aiRouter.get("/buddy/threads/:conversationId", asyncHandler(handleGetThread));
aiRouter.post("/buddy/messages", asyncHandler(handleSendMessage));

aiRouter.post("/event-planner", asyncHandler(handlePlanEvent));
aiRouter.get("/ice-breaker/:userId", asyncHandler(handleIceBreaker));
aiRouter.get("/recommendations/communities", asyncHandler(handleCommunityRecommendations));
aiRouter.post("/recommendations/communities/:communityId/dismiss", asyncHandler(handleDismissCommunityRecommendation));
aiRouter.get("/recommendations/matches", asyncHandler(handleMatchSuggestions));
aiRouter.post("/recommendations/matches/:userId/dismiss", asyncHandler(handleDismissMatchSuggestion));

aiRouter.get("/digest", asyncHandler(handleGetDigest));
aiRouter.get("/digest/history", asyncHandler(handleDigestHistory));
