import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  handleCreateMatch,
  handleGetMatch,
  handleListMyMatches,
  handleMakeMove,
  handleLeaderboard,
} from "../controllers/games.controller.js";

export const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.get("/matches", asyncHandler(handleListMyMatches));
gamesRouter.get("/matches/:matchId", asyncHandler(handleGetMatch));
gamesRouter.get("/:gameKey/leaderboard", asyncHandler(handleLeaderboard));
gamesRouter.post("/:gameKey/matches", asyncHandler(handleCreateMatch));
gamesRouter.post("/:gameKey/matches/:matchId/move", asyncHandler(handleMakeMove));
