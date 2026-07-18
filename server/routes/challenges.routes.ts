import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { handleCreate, handleList, handleJoin, handlePublish, handleGenerate } from "../controllers/challenges.controller.js";

// Mounted at /api/communities/:slug/challenges
export const challengesRouter = Router({ mergeParams: true });

challengesRouter.get("/", asyncHandler(handleList));
challengesRouter.post("/", asyncHandler(handleCreate));
challengesRouter.post("/generate", asyncHandler(handleGenerate));

// Mounted at /api/challenges — actions by id
export const challengeDetailRouter = Router();

challengeDetailRouter.use(requireAuth);
challengeDetailRouter.post("/:challengeId/join", asyncHandler(handleJoin));
challengeDetailRouter.post("/:challengeId/publish", asyncHandler(handlePublish));
