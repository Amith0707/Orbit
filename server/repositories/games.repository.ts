import { query } from "../db/client.js";

export interface GameRow {
  id: string;
  key: string;
  name: string;
}

export async function findGameByKey(key: string): Promise<GameRow | null> {
  const result = await query<GameRow>(`SELECT * FROM games WHERE key = $1`, [key]);
  return result.rows[0] ?? null;
}

export interface MatchRow {
  id: string;
  game_id: string;
  mode: "pvp" | "pvai";
  player_one_id: string | null;
  player_two_id: string | null;
  status: "in_progress" | "completed" | "abandoned";
  result: "player_one_win" | "player_two_win" | "draw" | "abandoned" | null;
  state: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export async function createMatch(input: {
  gameId: string;
  mode: "pvp" | "pvai";
  playerOneId: string;
  state: Record<string, unknown>;
}): Promise<MatchRow> {
  const result = await query<MatchRow>(
    `INSERT INTO game_matches (game_id, mode, player_one_id, state)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.gameId, input.mode, input.playerOneId, input.state]
  );
  return result.rows[0];
}

export async function findMatchById(matchId: string): Promise<MatchRow | null> {
  const result = await query<MatchRow>(`SELECT * FROM game_matches WHERE id = $1`, [matchId]);
  return result.rows[0] ?? null;
}

export async function findMatchWithGameKey(matchId: string): Promise<(MatchRow & { game_key: string }) | null> {
  const result = await query<MatchRow & { game_key: string }>(
    `SELECT gm.*, g.key AS game_key FROM game_matches gm JOIN games g ON g.id = gm.game_id WHERE gm.id = $1`,
    [matchId]
  );
  return result.rows[0] ?? null;
}

export async function updateMatchState(matchId: string, state: Record<string, unknown>): Promise<void> {
  await query(`UPDATE game_matches SET state = $2 WHERE id = $1`, [matchId, state]);
}

export async function completeMatch(
  matchId: string,
  result: "player_one_win" | "player_two_win" | "draw",
  state: Record<string, unknown>
): Promise<MatchRow> {
  const updated = await query<MatchRow>(
    `UPDATE game_matches SET status = 'completed', result = $2, state = $3, ended_at = now() WHERE id = $1 RETURNING *`,
    [matchId, result, state]
  );
  await query(`REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats`);
  return updated.rows[0];
}

export async function listMatchesForUser(userId: string, gameKey?: string, limit = 20): Promise<MatchRow[]> {
  const params: unknown[] = [userId];
  let gameFilter = "";
  if (gameKey) {
    params.push(gameKey);
    gameFilter = `AND g.key = $${params.length}`;
  }
  params.push(limit);

  const result = await query<MatchRow>(
    `SELECT gm.* FROM game_matches gm
     JOIN games g ON g.id = gm.game_id
     WHERE (gm.player_one_id = $1 OR gm.player_two_id = $1) ${gameFilter}
     ORDER BY gm.created_at DESC
     LIMIT $${params.length}`,
    params
  );
  return result.rows;
}

export interface LeaderboardRow {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  wins: string;
  losses: string;
  draws: string;
  games_played: string;
}

export async function getLeaderboard(gameKey: string, limit = 20): Promise<LeaderboardRow[]> {
  const result = await query<LeaderboardRow>(
    `SELECT ls.user_id, u.first_name, u.last_name, u.avatar_url, ls.wins, ls.losses, ls.draws, ls.games_played
     FROM leaderboard_stats ls
     JOIN users u ON u.id = ls.user_id
     WHERE ls.game_key = $1
     ORDER BY ls.wins DESC, ls.games_played DESC
     LIMIT $2`,
    [gameKey, limit]
  );
  return result.rows;
}
