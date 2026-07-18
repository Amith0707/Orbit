CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  duration_minutes int,
  estimated_cost numeric(10, 2),
  ideal_group_size_min int,
  ideal_group_size_max int,
  capacity int,
  agenda jsonb,
  things_to_bring jsonb,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_planner')),
  ai_raw_response jsonb,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_community_id ON events(community_id);

CREATE TABLE event_participants (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rsvp_status text NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'interested', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
