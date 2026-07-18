-- Postgres functions backing the parts of the data layer that PostgREST's REST
-- interface cannot express directly: multi-statement transactions, the
-- leaderboard materialized view refresh, and correlated-subquery aggregates
-- used for search/listing. Called from the Node server via supabase-js's
-- `.rpc()`, using the service_role key (bypasses RLS; the app enforces its
-- own authorization in Express middleware before ever reaching these).

-- === Poll voting (was a `withTransaction` block) ===============================

CREATE OR REPLACE FUNCTION create_poll_with_post(
  p_community_id uuid,
  p_author_id uuid,
  p_question text,
  p_options text[],
  p_allow_multiple boolean,
  p_closes_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_post_id uuid;
  v_poll jsonb;
  v_options jsonb;
BEGIN
  INSERT INTO posts (community_id, author_id, body)
  VALUES (p_community_id, p_author_id, p_question)
  RETURNING id INTO v_post_id;

  INSERT INTO polls (post_id, community_id, created_by, question, allow_multiple_choices, closes_at)
  VALUES (v_post_id, p_community_id, p_author_id, p_question, p_allow_multiple, p_closes_at)
  RETURNING to_jsonb(polls.*) INTO v_poll;

  WITH inserted_options AS (
    INSERT INTO poll_options (poll_id, label, display_order)
    SELECT (v_poll ->> 'id')::uuid, opt, ord - 1
    FROM unnest(p_options) WITH ORDINALITY AS t(opt, ord)
    RETURNING *
  )
  SELECT jsonb_agg(to_jsonb(inserted_options.*) ORDER BY display_order)
  INTO v_options
  FROM inserted_options;

  RETURN jsonb_build_object('post_id', v_post_id, 'poll', v_poll, 'options', v_options);
END;
$$;

CREATE OR REPLACE FUNCTION cast_poll_vote(
  p_poll_id uuid,
  p_user_id uuid,
  p_option_ids uuid[],
  p_allow_multiple boolean
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT p_allow_multiple THEN
    DELETE FROM poll_votes WHERE poll_id = p_poll_id AND user_id = p_user_id;
  ELSE
    DELETE FROM poll_votes
    WHERE poll_id = p_poll_id AND user_id = p_user_id AND poll_option_id = ANY(p_option_ids);
  END IF;

  INSERT INTO poll_votes (poll_id, poll_option_id, user_id)
  SELECT p_poll_id, opt_id, p_user_id FROM unnest(p_option_ids) AS opt_id
  ON CONFLICT (poll_id, poll_option_id, user_id) DO NOTHING;
END;
$$;

-- === Leaderboard materialized view refresh ======================================

CREATE OR REPLACE FUNCTION refresh_leaderboard() RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats;
$$;

-- === Communities =================================================================

CREATE OR REPLACE FUNCTION list_communities(
  p_viewer_id uuid,
  p_search text,
  p_joined_only boolean,
  p_limit int,
  p_offset int
) RETURNS TABLE (
  id uuid, name text, slug text, description text, cover_image_url text,
  created_by uuid, is_archived boolean, created_at timestamptz, updated_at timestamptz,
  member_count bigint, viewer_role text, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.created_by, c.is_archived, c.created_at, c.updated_at,
    (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
    (SELECT m.role FROM community_members m WHERE m.community_id = c.id AND m.user_id = p_viewer_id) AS viewer_role,
    COUNT(*) OVER() AS total_count
  FROM communities c
  WHERE c.is_archived = false
    AND (p_search IS NULL OR LOWER(c.name) LIKE p_search OR LOWER(c.description) LIKE p_search)
    AND (NOT p_joined_only OR EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = p_viewer_id))
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION list_communities_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid, name text, slug text, description text, cover_image_url text,
  created_by uuid, is_archived boolean, created_at timestamptz, updated_at timestamptz,
  member_count bigint, viewer_role text
)
LANGUAGE sql
AS $$
  SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.created_by, c.is_archived, c.created_at, c.updated_at,
    (SELECT COUNT(*) FROM community_members m2 WHERE m2.community_id = c.id) AS member_count,
    m.role AS viewer_role
  FROM communities c
  JOIN community_members m ON m.community_id = c.id AND m.user_id = p_user_id
  WHERE c.is_archived = false
  ORDER BY m.joined_at DESC;
$$;

CREATE OR REPLACE FUNCTION admin_list_communities(p_limit int, p_offset int)
RETURNS TABLE (
  id uuid, name text, slug text, description text, cover_image_url text,
  created_by uuid, is_archived boolean, created_at timestamptz, updated_at timestamptz,
  member_count bigint, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.created_by, c.is_archived, c.created_at, c.updated_at,
    (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
    COUNT(*) OVER() AS total_count
  FROM communities c
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- === Users (admin listing) ========================================================

CREATE OR REPLACE FUNCTION list_users(
  p_search text,
  p_role text,
  p_is_active boolean,
  p_limit int,
  p_offset int
) RETURNS TABLE (
  id uuid, email text, password_hash text, first_name text, last_name text, avatar_url text, role text,
  department_id uuid, job_title text, bio text, location text, availability text, hire_date date,
  is_active boolean, last_login_at timestamptz, created_at timestamptz, updated_at timestamptz, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url, u.role,
    u.department_id, u.job_title, u.bio, u.location, u.availability, u.hire_date,
    u.is_active, u.last_login_at, u.created_at, u.updated_at,
    COUNT(*) OVER() AS total_count
  FROM users u
  WHERE (p_search IS NULL OR LOWER(u.first_name || ' ' || u.last_name) LIKE p_search OR LOWER(u.email) LIKE p_search)
    AND (p_role IS NULL OR u.role = p_role)
    AND (p_is_active IS NULL OR u.is_active = p_is_active)
  ORDER BY u.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- === Posts =========================================================================

CREATE OR REPLACE FUNCTION list_community_posts(p_community_id uuid, p_viewer_id uuid, p_limit int, p_offset int)
RETURNS TABLE (
  id uuid, community_id uuid, author_id uuid, body text, image_url text, is_pinned boolean,
  created_at timestamptz, updated_at timestamptz, deleted_at timestamptz,
  first_name text, last_name text, avatar_url text,
  comment_count bigint, reaction_count bigint, viewer_reaction text, has_poll boolean, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT p.id, p.community_id, p.author_id, p.body, p.image_url, p.is_pinned, p.created_at, p.updated_at, p.deleted_at,
    u.first_name, u.last_name, u.avatar_url,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
    (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) AS reaction_count,
    (SELECT r.reaction_type FROM post_reactions r WHERE r.post_id = p.id AND r.user_id = p_viewer_id) AS viewer_reaction,
    EXISTS (SELECT 1 FROM polls pl WHERE pl.post_id = p.id) AS has_poll,
    COUNT(*) OVER() AS total_count
  FROM posts p
  JOIN users u ON u.id = p.author_id
  WHERE p.community_id = p_community_id AND p.deleted_at IS NULL
  ORDER BY p.is_pinned DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION find_post_by_id(p_post_id uuid, p_viewer_id uuid)
RETURNS TABLE (
  id uuid, community_id uuid, author_id uuid, body text, image_url text, is_pinned boolean,
  created_at timestamptz, updated_at timestamptz, deleted_at timestamptz,
  first_name text, last_name text, avatar_url text,
  comment_count bigint, reaction_count bigint, viewer_reaction text, has_poll boolean
)
LANGUAGE sql
AS $$
  SELECT p.id, p.community_id, p.author_id, p.body, p.image_url, p.is_pinned, p.created_at, p.updated_at, p.deleted_at,
    u.first_name, u.last_name, u.avatar_url,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
    (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) AS reaction_count,
    (SELECT r.reaction_type FROM post_reactions r WHERE r.post_id = p.id AND r.user_id = p_viewer_id) AS viewer_reaction,
    EXISTS (SELECT 1 FROM polls pl WHERE pl.post_id = p.id) AS has_poll
  FROM posts p
  JOIN users u ON u.id = p.author_id
  WHERE p.id = p_post_id AND p.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION admin_list_recent_posts(p_limit int, p_offset int)
RETURNS TABLE (
  id uuid, community_id uuid, author_id uuid, body text, image_url text, is_pinned boolean,
  created_at timestamptz, updated_at timestamptz, deleted_at timestamptz,
  first_name text, last_name text, avatar_url text, community_name text,
  comment_count bigint, reaction_count bigint, viewer_reaction text, has_poll boolean, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT p.id, p.community_id, p.author_id, p.body, p.image_url, p.is_pinned, p.created_at, p.updated_at, p.deleted_at,
    u.first_name, u.last_name, u.avatar_url, c.name AS community_name,
    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.deleted_at IS NULL) AS comment_count,
    (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) AS reaction_count,
    NULL::text AS viewer_reaction,
    EXISTS (SELECT 1 FROM polls pl WHERE pl.post_id = p.id) AS has_poll,
    COUNT(*) OVER() AS total_count
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN communities c ON c.id = p.community_id
  WHERE p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- === Events ========================================================================

CREATE OR REPLACE FUNCTION list_events(
  p_viewer_id uuid,
  p_community_id uuid,
  p_upcoming_only boolean,
  p_joined_only boolean,
  p_search text,
  p_limit int,
  p_offset int
) RETURNS TABLE (
  id uuid, community_id uuid, created_by uuid, title text, description text, location text,
  starts_at timestamptz, ends_at timestamptz, duration_minutes int, estimated_cost numeric,
  ideal_group_size_min int, ideal_group_size_max int, capacity int, agenda jsonb, things_to_bring jsonb,
  source text, ai_raw_response jsonb, status text, created_at timestamptz, updated_at timestamptz,
  participant_count bigint, viewer_rsvp_status text, community_name text, total_count bigint
)
LANGUAGE sql
AS $$
  SELECT e.id, e.community_id, e.created_by, e.title, e.description, e.location,
    e.starts_at, e.ends_at, e.duration_minutes, e.estimated_cost,
    e.ideal_group_size_min, e.ideal_group_size_max, e.capacity, e.agenda, e.things_to_bring,
    e.source, e.ai_raw_response, e.status, e.created_at, e.updated_at,
    (SELECT COUNT(*) FROM event_participants p WHERE p.event_id = e.id AND p.rsvp_status = 'going') AS participant_count,
    (SELECT p.rsvp_status FROM event_participants p WHERE p.event_id = e.id AND p.user_id = p_viewer_id) AS viewer_rsvp_status,
    c.name AS community_name,
    COUNT(*) OVER() AS total_count
  FROM events e
  LEFT JOIN communities c ON c.id = e.community_id
  WHERE e.status != 'cancelled'
    AND (NOT p_upcoming_only OR e.starts_at >= now())
    AND (p_community_id IS NULL OR e.community_id = p_community_id)
    AND (NOT p_joined_only OR EXISTS (SELECT 1 FROM event_participants p WHERE p.event_id = e.id AND p.user_id = p_viewer_id))
    AND (p_search IS NULL OR LOWER(e.title) LIKE p_search)
  ORDER BY e.starts_at ASC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION find_event_by_id(p_event_id uuid, p_viewer_id uuid)
RETURNS TABLE (
  id uuid, community_id uuid, created_by uuid, title text, description text, location text,
  starts_at timestamptz, ends_at timestamptz, duration_minutes int, estimated_cost numeric,
  ideal_group_size_min int, ideal_group_size_max int, capacity int, agenda jsonb, things_to_bring jsonb,
  source text, ai_raw_response jsonb, status text, created_at timestamptz, updated_at timestamptz,
  participant_count bigint, viewer_rsvp_status text, community_name text
)
LANGUAGE sql
AS $$
  SELECT e.id, e.community_id, e.created_by, e.title, e.description, e.location,
    e.starts_at, e.ends_at, e.duration_minutes, e.estimated_cost,
    e.ideal_group_size_min, e.ideal_group_size_max, e.capacity, e.agenda, e.things_to_bring,
    e.source, e.ai_raw_response, e.status, e.created_at, e.updated_at,
    (SELECT COUNT(*) FROM event_participants p WHERE p.event_id = e.id AND p.rsvp_status = 'going') AS participant_count,
    (SELECT p.rsvp_status FROM event_participants p WHERE p.event_id = e.id AND p.user_id = p_viewer_id) AS viewer_rsvp_status,
    c.name AS community_name
  FROM events e
  LEFT JOIN communities c ON c.id = e.community_id
  WHERE e.id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION list_upcoming_events_for_user(p_user_id uuid, p_limit int)
RETURNS TABLE (
  id uuid, community_id uuid, created_by uuid, title text, description text, location text,
  starts_at timestamptz, ends_at timestamptz, duration_minutes int, estimated_cost numeric,
  ideal_group_size_min int, ideal_group_size_max int, capacity int, agenda jsonb, things_to_bring jsonb,
  source text, ai_raw_response jsonb, status text, created_at timestamptz, updated_at timestamptz,
  participant_count bigint, viewer_rsvp_status text, community_name text
)
LANGUAGE sql
AS $$
  SELECT e.id, e.community_id, e.created_by, e.title, e.description, e.location,
    e.starts_at, e.ends_at, e.duration_minutes, e.estimated_cost,
    e.ideal_group_size_min, e.ideal_group_size_max, e.capacity, e.agenda, e.things_to_bring,
    e.source, e.ai_raw_response, e.status, e.created_at, e.updated_at,
    (SELECT COUNT(*) FROM event_participants p WHERE p.event_id = e.id AND p.rsvp_status = 'going') AS participant_count,
    (SELECT p.rsvp_status FROM event_participants p WHERE p.event_id = e.id AND p.user_id = p_user_id) AS viewer_rsvp_status,
    c.name AS community_name
  FROM events e
  LEFT JOIN communities c ON c.id = e.community_id
  WHERE e.status = 'scheduled' AND e.starts_at >= now()
    AND (
      EXISTS (SELECT 1 FROM event_participants p WHERE p.event_id = e.id AND p.user_id = p_user_id)
      OR e.community_id IN (SELECT community_id FROM community_members WHERE user_id = p_user_id)
    )
  ORDER BY e.starts_at ASC
  LIMIT p_limit;
$$;

-- === AI recommendation candidate scoring ===========================================

CREATE OR REPLACE FUNCTION list_candidate_communities(p_user_id uuid, p_department_id uuid)
RETURNS TABLE (
  id uuid, name text, slug text, description text, cover_image_url text, created_at timestamptz,
  member_count bigint, coworker_count bigint
)
LANGUAGE sql
AS $$
  SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.created_at,
    (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
    (SELECT COUNT(*) FROM community_members m
       JOIN users u2 ON u2.id = m.user_id
       WHERE m.community_id = c.id AND u2.department_id = p_department_id) AS coworker_count
  FROM communities c
  WHERE c.is_archived = false
    AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = p_user_id)
  ORDER BY c.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION list_candidate_coworkers(p_user_id uuid, p_limit int)
RETURNS TABLE (
  id uuid, first_name text, last_name text, avatar_url text, job_title text,
  department_id uuid, department_name text, shared_community_count bigint, shared_upcoming_event_count bigint
)
LANGUAGE sql
AS $$
  SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.job_title, u.department_id, d.name AS department_name,
    (SELECT COUNT(*) FROM community_members m1
       JOIN community_members m2 ON m2.community_id = m1.community_id
       WHERE m1.user_id = p_user_id AND m2.user_id = u.id) AS shared_community_count,
    (SELECT COUNT(*) FROM event_participants p1
       JOIN event_participants p2 ON p2.event_id = p1.event_id
       JOIN events e ON e.id = p1.event_id
       WHERE p1.user_id = p_user_id AND p2.user_id = u.id AND e.starts_at >= now()) AS shared_upcoming_event_count
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id
  WHERE u.id != p_user_id AND u.is_active = true
  ORDER BY u.created_at DESC
  LIMIT p_limit;
$$;

-- All of the above run with the privileges of the calling role. The server only ever
-- calls these with the service_role key (full access, bypasses RLS), so no additional
-- grants are required beyond Postgres's default EXECUTE-to-PUBLIC on new functions.
