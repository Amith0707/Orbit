import { query } from "../db/client.js";

export interface CandidateCommunityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  member_count: string;
  coworker_count: string;
  created_at: string;
}

export async function listCandidateCommunities(userId: string, departmentId: string | null): Promise<CandidateCommunityRow[]> {
  const result = await query<CandidateCommunityRow>(
    `SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.created_at,
       (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
       (SELECT COUNT(*) FROM community_members m
          JOIN users u2 ON u2.id = m.user_id
          WHERE m.community_id = c.id AND u2.department_id = $2) AS coworker_count
     FROM communities c
     WHERE c.is_archived = false
       AND NOT EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = $1)
     ORDER BY c.created_at DESC`,
    [userId, departmentId]
  );
  return result.rows;
}

export interface CandidateCoworkerRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  shared_community_count: string;
  shared_upcoming_event_count: string;
}

export async function listCandidateCoworkers(userId: string, limit: number): Promise<CandidateCoworkerRow[]> {
  const result = await query<CandidateCoworkerRow>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.job_title, u.department_id, d.name AS department_name,
       (SELECT COUNT(*) FROM community_members m1
          JOIN community_members m2 ON m2.community_id = m1.community_id
          WHERE m1.user_id = $1 AND m2.user_id = u.id) AS shared_community_count,
       (SELECT COUNT(*) FROM event_participants p1
          JOIN event_participants p2 ON p2.event_id = p1.event_id
          JOIN events e ON e.id = p1.event_id
          WHERE p1.user_id = $1 AND p2.user_id = u.id AND e.starts_at >= now()) AS shared_upcoming_event_count
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id != $1 AND u.is_active = true
     ORDER BY u.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
