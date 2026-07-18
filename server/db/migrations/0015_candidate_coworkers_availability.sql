-- Adds availability to list_candidate_coworkers so coworker matching (AI Buddy +
-- Match Suggestions) can factor in free-time overlap, not just tags/department/events.
-- CREATE OR REPLACE can't change a function's return columns, so drop first.
DROP FUNCTION IF EXISTS list_candidate_coworkers(uuid, int);

CREATE OR REPLACE FUNCTION list_candidate_coworkers(p_user_id uuid, p_limit int)
RETURNS TABLE (
  id uuid, first_name text, last_name text, avatar_url text, job_title text,
  department_id uuid, department_name text, availability text,
  shared_community_count bigint, shared_upcoming_event_count bigint
)
LANGUAGE sql
AS $$
  SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.job_title, u.department_id, d.name AS department_name,
    u.availability,
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
