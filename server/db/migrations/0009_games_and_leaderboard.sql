CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO games (key, name) VALUES
  ('chess', 'Chess'),
  ('tic_tac_toe', 'Tic Tac Toe');

CREATE TABLE game_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  mode text NOT NULL DEFAULT 'pvp' CHECK (mode IN ('pvp', 'pvai')),
  player_one_id uuid REFERENCES users(id) ON DELETE SET NULL,
  player_two_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  result text CHECK (result IN ('player_one_win', 'player_two_win', 'draw', 'abandoned')),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_matches_player_one ON game_matches(player_one_id);
CREATE INDEX idx_game_matches_player_two ON game_matches(player_two_id);
CREATE INDEX idx_game_matches_game_status ON game_matches(game_id, status);

-- Refreshed synchronously right after a match completes; cheap at this scale.
CREATE MATERIALIZED VIEW leaderboard_stats AS
SELECT
  gm.game_id,
  g.key AS game_key,
  p.user_id,
  COUNT(*) FILTER (WHERE
    (p.user_id = gm.player_one_id AND gm.result = 'player_one_win') OR
    (p.user_id = gm.player_two_id AND gm.result = 'player_two_win')
  ) AS wins,
  COUNT(*) FILTER (WHERE
    (p.user_id = gm.player_one_id AND gm.result = 'player_two_win') OR
    (p.user_id = gm.player_two_id AND gm.result = 'player_one_win')
  ) AS losses,
  COUNT(*) FILTER (WHERE gm.result = 'draw') AS draws,
  COUNT(*) AS games_played
FROM game_matches gm
JOIN games g ON g.id = gm.game_id
CROSS JOIN LATERAL (
  VALUES (gm.player_one_id), (gm.player_two_id)
) AS p(user_id)
WHERE gm.status = 'completed' AND p.user_id IS NOT NULL
GROUP BY gm.game_id, g.key, p.user_id;

CREATE UNIQUE INDEX idx_leaderboard_stats_game_user ON leaderboard_stats(game_id, user_id);
