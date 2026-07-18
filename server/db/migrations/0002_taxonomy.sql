-- Unified interests/hobbies/skills taxonomy: one joinable signal for every
-- AI recommendation/matching feature instead of three separate join tables.
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('interest', 'hobby', 'skill')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);

CREATE TABLE user_tags (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX idx_user_tags_tag_id ON user_tags(tag_id);
