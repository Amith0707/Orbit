import { query } from "../db/client.js";

export interface ChallengeRow {
  id: string;
  community_id: string;
  created_by: string | null;
  title: string;
  description: string;
  goal_metric: string | null;
  goal_target: string | null;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "completed" | "archived";
  source: "manual" | "ai_generated";
  ai_raw_response: Record<string, unknown> | null;
  created_at: string;
}

export async function createChallenge(input: {
  communityId: string;
  createdBy: string | null;
  title: string;
  description: string;
  goalMetric?: string;
  goalTarget?: number;
  startsAt: string;
  endsAt: string;
  status?: "draft" | "active";
  source?: "manual" | "ai_generated";
  aiRawResponse?: Record<string, unknown>;
}): Promise<ChallengeRow> {
  const result = await query<ChallengeRow>(
    `INSERT INTO community_challenges
       (community_id, created_by, title, description, goal_metric, goal_target, starts_at, ends_at, status, source, ai_raw_response)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      input.communityId,
      input.createdBy,
      input.title,
      input.description,
      input.goalMetric ?? null,
      input.goalTarget ?? null,
      input.startsAt,
      input.endsAt,
      input.status ?? "active",
      input.source ?? "manual",
      input.aiRawResponse ?? null,
    ]
  );
  return result.rows[0];
}

export async function listChallengesForCommunity(communityId: string): Promise<ChallengeRow[]> {
  const result = await query<ChallengeRow>(
    `SELECT * FROM community_challenges WHERE community_id = $1 ORDER BY created_at DESC`,
    [communityId]
  );
  return result.rows;
}

export async function findChallengeById(id: string): Promise<ChallengeRow | null> {
  const result = await query<ChallengeRow>(`SELECT * FROM community_challenges WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function publishChallenge(id: string): Promise<ChallengeRow> {
  const result = await query<ChallengeRow>(
    `UPDATE community_challenges SET status = 'active' WHERE id = $1 AND status = 'draft' RETURNING *`,
    [id]
  );
  return result.rows[0];
}

export async function joinChallenge(challengeId: string, userId: string): Promise<void> {
  await query(
    `INSERT INTO community_challenge_participants (challenge_id, user_id) VALUES ($1, $2)
     ON CONFLICT (challenge_id, user_id) DO NOTHING`,
    [challengeId, userId]
  );
}

export async function countParticipants(challengeId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM community_challenge_participants WHERE challenge_id = $1`,
    [challengeId]
  );
  return Number.parseInt(result.rows[0].count, 10);
}

export async function getRecentTitlesForCommunity(communityId: string, limit = 5): Promise<string[]> {
  const result = await query<{ title: string }>(
    `SELECT title FROM community_challenges WHERE community_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [communityId, limit]
  );
  return result.rows.map((r) => r.title);
}
