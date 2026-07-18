CREATE TABLE weekly_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  stats jsonb NOT NULL,
  narrative text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX idx_weekly_digests_user_week ON weekly_digests(user_id, week_start DESC);
