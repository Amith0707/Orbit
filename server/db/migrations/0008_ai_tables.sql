CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id, updated_at DESC);

CREATE TABLE ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  tool_call_id text,
  tool_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conv_created ON ai_messages(conversation_id, created_at);

-- Durable facts distilled from conversations/activity (e.g. "prefers evening events").
CREATE TABLE ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fact text NOT NULL,
  source_conversation_id uuid REFERENCES ai_conversations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_memory_user_id ON ai_memory(user_id, is_active, created_at DESC);

-- Doubles as a freshness cache: check for a recent row before recomputing + re-calling OpenAI.
-- target_id is intentionally polymorphic (community id or user id depending on recommendation_type),
-- so it is not FK-constrained.
CREATE TABLE ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('community', 'match', 'ice_breaker')),
  target_id uuid NOT NULL,
  score numeric(5, 4) NOT NULL,
  score_breakdown jsonb NOT NULL,
  ai_explanation text,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_recommendations_user_type_created ON ai_recommendations(user_id, recommendation_type, created_at DESC);
CREATE INDEX idx_ai_recommendations_target ON ai_recommendations(recommendation_type, target_id);
