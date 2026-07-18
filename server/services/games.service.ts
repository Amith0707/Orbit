import { Chess } from "chess.js";
import * as gamesRepo from "../repositories/games.repository.js";
import * as ticTacToe from "./games/tic-tac-toe.js";
import * as rps from "./games/rock-paper-scissors.js";
import * as connectFour from "./games/connect-four.js";
import { pickAiMove as pickChessAiMove } from "./games/chess-ai.js";
import { AppError } from "../utils/app-error.js";
import { notifyUser } from "./notifications.service.js";
import type { MatchRow } from "../repositories/games.repository.js";

export type GameKey = "chess" | "tic_tac_toe" | "rock_paper_scissors" | "connect_four";

function toMatchDTO(match: MatchRow, gameKey: string) {
  return {
    id: match.id,
    gameKey,
    mode: match.mode,
    playerOneId: match.player_one_id,
    playerTwoId: match.player_two_id,
    status: match.status,
    result: match.result,
    state: match.state,
    startedAt: match.started_at,
    endedAt: match.ended_at,
  };
}

function initialStateFor(gameKey: GameKey): Record<string, unknown> {
  if (gameKey === "chess") return { fen: new Chess().fen(), pgn: "" };
  if (gameKey === "tic_tac_toe") return ticTacToe.initialState() as unknown as Record<string, unknown>;
  if (gameKey === "rock_paper_scissors") return rps.initialState() as unknown as Record<string, unknown>;
  return connectFour.initialState() as unknown as Record<string, unknown>;
}

export async function createMatch(userId: string, gameKey: GameKey, mode: "pvp" | "pvai") {
  const game = await gamesRepo.findGameByKey(gameKey);
  if (!game) throw AppError.notFound("Unknown game");

  const match = await gamesRepo.createMatch({
    gameId: game.id,
    mode,
    playerOneId: userId,
    state: initialStateFor(gameKey),
  });
  return toMatchDTO(match, gameKey);
}

async function loadMatchForPlayer(matchId: string, userId: string) {
  const match = await gamesRepo.findMatchWithGameKey(matchId);
  if (!match) throw AppError.notFound("Match not found");
  if (match.player_one_id !== userId && match.player_two_id !== userId) {
    throw AppError.forbidden("You are not a player in this match");
  }
  return match;
}

export async function getMatch(matchId: string, userId: string) {
  const match = await loadMatchForPlayer(matchId, userId);
  return toMatchDTO(match, match.game_key);
}

export async function listMyMatches(userId: string, gameKey?: string) {
  const matches = await gamesRepo.listMatchesForUser(userId, gameKey);
  return matches.map((m) => toMatchDTO(m, gameKey ?? ""));
}

async function finishMatch(matchId: string, gameKey: string, result: "player_one_win" | "player_two_win" | "draw", state: Record<string, unknown>, playerOneId: string | null) {
  const completed = await gamesRepo.completeMatch(matchId, result, state);
  if (playerOneId && result !== "draw") {
    const won = result === "player_one_win";
    await notifyUser({
      userId: playerOneId,
      type: "mention",
      title: won ? "You won!" : "Match complete",
      body: won ? `You won your ${gameKey.replace("_", " ")} match!` : `Your ${gameKey.replace("_", " ")} match has ended.`,
      linkUrl: "/games/leaderboard",
    });
  }
  return toMatchDTO(completed, gameKey);
}

export async function makeTicTacToeMove(matchId: string, userId: string, cell: number) {
  const match = await loadMatchForPlayer(matchId, userId);
  if (match.game_key !== "tic_tac_toe") throw AppError.badRequest("This match is not tic-tac-toe");
  if (match.status !== "in_progress") throw AppError.badRequest("This match has already ended");

  let state = match.state as unknown as ticTacToe.TicTacToeState;

  // In both modes the human submits moves for whichever symbol's turn it currently is:
  // in PvAI that's always "X" (the human); in local PvP two people alternate X/O on one device.
  const humanSymbol = state.turn;
  try {
    state = ticTacToe.applyMove(state, cell, humanSymbol);
  } catch (err) {
    throw AppError.badRequest(err instanceof Error ? err.message : "Invalid move");
  }

  let winner = ticTacToe.checkWinner(state.board);

  if (!winner && match.mode === "pvai") {
    const aiCell = ticTacToe.pickAiMove(state);
    state = ticTacToe.applyMove(state, aiCell, state.turn);
    winner = ticTacToe.checkWinner(state.board);
  }

  if (winner) {
    const result = winner === "draw" ? "draw" : winner === "X" ? "player_one_win" : "player_two_win";
    return finishMatch(matchId, "tic_tac_toe", result, state as unknown as Record<string, unknown>, match.player_one_id);
  }

  await gamesRepo.updateMatchState(matchId, state as unknown as Record<string, unknown>);
  return toMatchDTO({ ...match, state: state as unknown as Record<string, unknown> }, "tic_tac_toe");
}

export async function makeRockPaperScissorsMove(matchId: string, userId: string, choice: rps.Choice) {
  const match = await loadMatchForPlayer(matchId, userId);
  if (match.game_key !== "rock_paper_scissors") throw AppError.badRequest("This match is not rock paper scissors");
  if (match.status !== "in_progress") throw AppError.badRequest("This match has already ended");

  let state = match.state as unknown as rps.RpsState;
  try {
    state = rps.applyChoice(state, state.turn, choice);
  } catch (err) {
    throw AppError.badRequest(err instanceof Error ? err.message : "Invalid move");
  }

  // Mirrors the tic-tac-toe pattern: the human always plays "player one," so once their
  // choice flips the turn to "player two," the AI immediately plays that side in pvai mode.
  if (match.mode === "pvai" && state.turn === "player_two") {
    state = rps.applyChoice(state, "player_two", rps.pickAiChoice());
  }

  const winner = rps.checkMatchWinner(state);
  if (winner) {
    const result = winner === "draw" ? "draw" : winner === "player_one" ? "player_one_win" : "player_two_win";
    return finishMatch(matchId, "rock_paper_scissors", result, state as unknown as Record<string, unknown>, match.player_one_id);
  }

  await gamesRepo.updateMatchState(matchId, state as unknown as Record<string, unknown>);
  return toMatchDTO({ ...match, state: state as unknown as Record<string, unknown> }, "rock_paper_scissors");
}

export async function makeConnectFourMove(matchId: string, userId: string, column: number) {
  const match = await loadMatchForPlayer(matchId, userId);
  if (match.game_key !== "connect_four") throw AppError.badRequest("This match is not connect four");
  if (match.status !== "in_progress") throw AppError.badRequest("This match has already ended");

  let state = match.state as unknown as connectFour.ConnectFourState;
  const humanDisc = state.turn;
  try {
    state = connectFour.applyMove(state, column, humanDisc);
  } catch (err) {
    throw AppError.badRequest(err instanceof Error ? err.message : "Invalid move");
  }

  let winner = connectFour.checkWinner(state.board);

  if (!winner && match.mode === "pvai") {
    const aiColumn = connectFour.pickAiMove(state);
    state = connectFour.applyMove(state, aiColumn, state.turn);
    winner = connectFour.checkWinner(state.board);
  }

  if (winner) {
    const result = winner === "draw" ? "draw" : winner === "R" ? "player_one_win" : "player_two_win";
    return finishMatch(matchId, "connect_four", result, state as unknown as Record<string, unknown>, match.player_one_id);
  }

  await gamesRepo.updateMatchState(matchId, state as unknown as Record<string, unknown>);
  return toMatchDTO({ ...match, state: state as unknown as Record<string, unknown> }, "connect_four");
}

export async function makeChessMove(matchId: string, userId: string, move: { from: string; to: string; promotion?: string }) {
  const match = await loadMatchForPlayer(matchId, userId);
  if (match.game_key !== "chess") throw AppError.badRequest("This match is not chess");
  if (match.status !== "in_progress") throw AppError.badRequest("This match has already ended");

  const state = match.state as unknown as { fen: string; pgn: string };
  const chess = new Chess(state.fen);

  try {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
  } catch {
    throw AppError.badRequest(`Invalid move: ${move.from}-${move.to}`);
  }

  if (!chess.isGameOver() && match.mode === "pvai") {
    const aiMove = pickChessAiMove(chess.fen());
    chess.move({ from: aiMove.from, to: aiMove.to, promotion: aiMove.promotion });
  }

  const newState = { fen: chess.fen(), pgn: chess.pgn() };

  if (chess.isGameOver()) {
    let result: "player_one_win" | "player_two_win" | "draw";
    if (chess.isCheckmate()) {
      // The side whose turn it is now (chess.turn()) is the one checkmated.
      result = chess.turn() === "w" ? "player_two_win" : "player_one_win";
    } else {
      result = "draw";
    }
    return finishMatch(matchId, "chess", result, newState, match.player_one_id);
  }

  await gamesRepo.updateMatchState(matchId, newState);
  return toMatchDTO({ ...match, state: newState }, "chess");
}

export async function getLeaderboard(gameKey: string) {
  const rows = await gamesRepo.getLeaderboard(gameKey);
  return rows.map((r) => ({
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    avatarUrl: r.avatar_url,
    wins: Number.parseInt(r.wins, 10),
    losses: Number.parseInt(r.losses, 10),
    draws: Number.parseInt(r.draws, 10),
    gamesPlayed: Number.parseInt(r.games_played, 10),
  }));
}
