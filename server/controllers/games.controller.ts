import type { Request, Response } from "express";
import { z } from "zod";
import { pathParam } from "../utils/params.js";
import * as gamesService from "../services/games.service.js";
import { AppError } from "../utils/app-error.js";

const gameKeySchema = z.enum(["chess", "tic_tac_toe"]);

const createMatchSchema = z.object({
  mode: z.enum(["pvp", "pvai"]),
});

export async function handleCreateMatch(req: Request, res: Response) {
  const gameKey = gameKeySchema.parse(pathParam(req, "gameKey"));
  const { mode } = createMatchSchema.parse(req.body);
  const match = await gamesService.createMatch(req.user!.id, gameKey, mode);
  res.status(201).json({ match });
}

export async function handleGetMatch(req: Request, res: Response) {
  const match = await gamesService.getMatch(pathParam(req, "matchId"), req.user!.id);
  res.json({ match });
}

const listQuerySchema = z.object({ gameKey: gameKeySchema.optional() });

export async function handleListMyMatches(req: Request, res: Response) {
  const { gameKey } = listQuerySchema.parse(req.query);
  const matches = await gamesService.listMyMatches(req.user!.id, gameKey);
  res.json({ matches });
}

const ticTacToeMoveSchema = z.object({ cell: z.number().int().min(0).max(8) });
const chessMoveSchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(["q", "r", "b", "n"]).optional(),
});

export async function handleMakeMove(req: Request, res: Response) {
  const gameKey = gameKeySchema.parse(pathParam(req, "gameKey"));
  const matchId = pathParam(req, "matchId");

  if (gameKey === "tic_tac_toe") {
    const { cell } = ticTacToeMoveSchema.parse(req.body);
    const match = await gamesService.makeTicTacToeMove(matchId, req.user!.id, cell);
    res.json({ match });
    return;
  }

  if (gameKey === "chess") {
    const move = chessMoveSchema.parse(req.body);
    const match = await gamesService.makeChessMove(matchId, req.user!.id, move);
    res.json({ match });
    return;
  }

  throw AppError.badRequest("Unsupported game");
}

export async function handleLeaderboard(req: Request, res: Response) {
  const gameKey = gameKeySchema.parse(pathParam(req, "gameKey"));
  const leaderboard = await gamesService.getLeaderboard(gameKey);
  res.json({ leaderboard });
}
