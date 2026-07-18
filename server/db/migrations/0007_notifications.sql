CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'post_reaction', 'post_comment', 'event_reminder', 'event_rsvp',
    'community_invite', 'poll_new', 'poll_closed', 'match_suggestion',
    'digest_ready', 'mention', 'challenge_new'
  )),
  title text NOT NULL,
  body text,
  link_url text,
  metadata jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread_created ON notifications(user_id, is_read, created_at DESC);
