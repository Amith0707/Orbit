CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  question text NOT NULL,
  allow_multiple_choices boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  is_closed boolean NOT NULL DEFAULT false,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);

CREATE INDEX idx_poll_options_poll_order ON poll_options(poll_id, display_order);

CREATE TABLE poll_votes (
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  poll_option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, poll_option_id, user_id)
);

CREATE INDEX idx_poll_votes_poll_user ON poll_votes(poll_id, user_id);
