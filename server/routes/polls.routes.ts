import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { handleCreatePoll, handleGetPoll, handleVote, handleClosePoll } from "../controllers/polls.controller.js";

// Mounted at /api/posts/:postId/poll
export const pollsRouter = Router({ mergeParams: true });

pollsRouter.get("/", asyncHandler(handleGetPoll));
pollsRouter.post("/vote", asyncHandler(handleVote));
pollsRouter.post("/close", asyncHandler(handleClosePoll));

// Mounted at /api/communities/:slug/polls
export const communityPollsRouter = Router({ mergeParams: true });

communityPollsRouter.post("/", asyncHandler(handleCreatePoll));
