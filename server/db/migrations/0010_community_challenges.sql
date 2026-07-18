CREATE TABLE community_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  goal_metric text,
  goal_target numeric,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated')),
  ai_raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_challenges_community_status ON community_challenges(community_id, status);

CREATE TABLE community_challenge_participants (
  challenge_id uuid NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
