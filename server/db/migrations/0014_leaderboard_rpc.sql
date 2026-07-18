-- `leaderboard_stats` is a MATERIALIZED VIEW, so it carries no foreign key to `users`
-- (materialized views can't have FK constraints) -- PostgREST's embedding syntax
-- (`select=*,users(...)`) relies on a real FK to detect the relationship, so it can't
-- join leaderboard_stats to users on its own. This RPC does the join directly instead.

CREATE OR REPLACE FUNCTION get_leaderboard(p_game_key text, p_limit int)
RETURNS TABLE (
  user_id uuid, first_name text, last_name text, avatar_url text,
  wins bigint, losses bigint, draws bigint, games_played bigint
)
LANGUAGE sql
AS $$
  SELECT ls.user_id, u.first_name, u.last_name, u.avatar_url, ls.wins, ls.losses, ls.draws, ls.games_played
  FROM leaderboard_stats ls
  JOIN users u ON u.id = ls.user_id
  WHERE ls.game_key = p_game_key
  ORDER BY ls.wins DESC, ls.games_played DESC
  LIMIT p_limit;
$$;
