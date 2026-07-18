import { query } from "../db/client.js";

export interface WeeklyDigestRow {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  stats: Record<string, unknown>;
  narrative: string;
  created_at: string;
}

export async function findDigestForWeek(userId: string, weekStart: string): Promise<WeeklyDigestRow | null> {
  const result = await query<WeeklyDigestRow>(
    `SELECT * FROM weekly_digests WHERE user_id = $1 AND week_start = $2`,
    [userId, weekStart]
  );
  return result.rows[0] ?? null;
}

export async function createDigest(input: {
  userId: string;
  weekStart: string;
  weekEnd: string;
  stats: Record<string, unknown>;
  narrative: string;
}): Promise<WeeklyDigestRow> {
  const result = await query<WeeklyDigestRow>(
    `INSERT INTO weekly_digests (user_id, week_start, week_end, stats, narrative)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.userId, input.weekStart, input.weekEnd, input.stats, input.narrative]
  );
  return result.rows[0];
}

export async function listRecentDigests(userId: string, limit = 8): Promise<WeeklyDigestRow[]> {
  const result = await query<WeeklyDigestRow>(
    `SELECT * FROM weekly_digests WHERE user_id = $1 ORDER BY week_start DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function countNewPostsForUserCommunities(userId: string, since: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM posts p
     WHERE p.deleted_at IS NULL AND p.created_at >= $2
       AND p.community_id IN (SELECT community_id FROM community_members WHERE user_id = $1)`,
    [userId, since]
  );
  return Number.parseInt(result.rows[0].count, 10);
}

export interface ActiveChallengeRow {
  title: string;
  community_name: string;
}

export async function listActiveChallengesForUserCommunities(userId: string, limit = 3): Promise<ActiveChallengeRow[]> {
  const result = await query<ActiveChallengeRow>(
    `SELECT cc.title, c.name AS community_name
     FROM community_challenges cc
     JOIN communities c ON c.id = cc.community_id
     WHERE cc.status = 'active'
       AND cc.community_id IN (SELECT community_id FROM community_members WHERE user_id = $1)
     ORDER BY cc.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}
