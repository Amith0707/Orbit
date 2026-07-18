import { api } from "@/lib/http/apiClient";

export type GameKey = "chess" | "tic_tac_toe";
export type GameMode = "pvp" | "pvai";

export interface TicTacToeState {
  board: ("X" | "O" | null)[];
  turn: "X" | "O";
}

export interface ChessState {
  fen: string;
  pgn: string;
}

export interface Match<TState = Record<string, unknown>> {
  id: string;
  gameKey: GameKey;
  mode: GameMode;
  playerOneId: string | null;
  playerTwoId: string | null;
  status: "in_progress" | "completed" | "abandoned";
  result: "player_one_win" | "player_two_win" | "draw" | "abandoned" | null;
  state: TState;
  startedAt: string;
  endedAt: string | null;
}

export async function createMatch(gameKey: GameKey, mode: GameMode): Promise<Match> {
  const { data } = await api.post<{ match: Match }>(`/games/${gameKey}/matches`, { mode });
  return data.match;
}

export async function getMatch(matchId: string): Promise<Match> {
  const { data } = await api.get<{ match: Match }>(`/games/matches/${matchId}`);
  return data.match;
}

export async function makeTicTacToeMove(matchId: string, cell: number): Promise<Match<TicTacToeState>> {
  const { data } = await api.post<{ match: Match<TicTacToeState> }>(`/games/tic_tac_toe/matches/${matchId}/move`, { cell });
  return data.match;
}

export async function makeChessMove(matchId: string, from: string, to: string, promotion?: string): Promise<Match<ChessState>> {
  const { data } = await api.post<{ match: Match<ChessState> }>(`/games/chess/matches/${matchId}/move`, { from, to, promotion });
  return data.match;
}

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

export async function getLeaderboard(gameKey: GameKey): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<{ leaderboard: LeaderboardEntry[] }>(`/games/${gameKey}/leaderboard`);
  return data.leaderboard;
}
