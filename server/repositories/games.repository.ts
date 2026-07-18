import { supabase, unwrap } from "../db/supabase-client.js";

export interface GameRow {
  id: string;
  key: string;
  name: string;
}

export async function findGameByKey(key: string): Promise<GameRow | null> {
  const rows = unwrap(await supabase.from("games").select("*").eq("key", key)) as unknown as GameRow[];
  return rows[0] ?? null;
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
  const rows = unwrap(
    await supabase
      .from("game_matches")
      .insert({ game_id: input.gameId, mode: input.mode, player_one_id: input.playerOneId, state: input.state })
      .select("*")
  ) as unknown as MatchRow[];
  return rows[0];
}

export async function findMatchById(matchId: string): Promise<MatchRow | null> {
  const rows = unwrap(await supabase.from("game_matches").select("*").eq("id", matchId)) as unknown as MatchRow[];
  return rows[0] ?? null;
}

export async function findMatchWithGameKey(matchId: string): Promise<(MatchRow & { game_key: string }) | null> {
  const rows = unwrap(
    await supabase.from("game_matches").select("*, games(key)").eq("id", matchId)
  ) as unknown as (MatchRow & { games: { key: string } })[];
  const row = rows[0];
  if (!row) return null;
  const { games, ...rest } = row;
  return { ...rest, game_key: games.key };
}

export async function updateMatchState(matchId: string, state: Record<string, unknown>): Promise<void> {
  unwrap(await supabase.from("game_matches").update({ state }).eq("id", matchId));
}

export async function completeMatch(
  matchId: string,
  result: "player_one_win" | "player_two_win" | "draw",
  state: Record<string, unknown>
): Promise<MatchRow> {
  const rows = unwrap(
    await supabase
      .from("game_matches")
      .update({ status: "completed", result, state, ended_at: new Date().toISOString() })
      .eq("id", matchId)
      .select("*")
  ) as unknown as MatchRow[];
  unwrap(await supabase.rpc("refresh_leaderboard"));
  return rows[0];
}

export async function listMatchesForUser(userId: string, gameKey?: string, limit = 20): Promise<MatchRow[]> {
  let q = supabase
    .from("game_matches")
    .select(gameKey ? "*, games!inner(key)" : "*")
    .or(`player_one_id.eq.${userId},player_two_id.eq.${userId}`);
  if (gameKey) q = q.eq("games.key", gameKey);
  q = q.order("created_at", { ascending: false }).limit(limit);

  const rows = unwrap(await q) as unknown as (MatchRow & { games?: { key: string } })[];
  return rows.map((row) => {
    const { games, ...rest } = row;
    void games;
    return rest;
  });
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
  // leaderboard_stats is a materialized view (no FK to users), so PostgREST can't embed
  // the join itself -- get_leaderboard() does it directly in Postgres. See migration 0014.
  const rows = unwrap(
    await supabase.rpc("get_leaderboard", { p_game_key: gameKey, p_limit: limit })
  ) as {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    wins: number;
    losses: number;
    draws: number;
    games_played: number;
  }[];

  return rows.map((r) => ({
    user_id: r.user_id,
    first_name: r.first_name,
    last_name: r.last_name,
    avatar_url: r.avatar_url,
    wins: String(r.wins),
    losses: String(r.losses),
    draws: String(r.draws),
    games_played: String(r.games_played),
  }));
}
