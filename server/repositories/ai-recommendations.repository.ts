import { query } from "../db/client.js";

export type RecommendationType = "community" | "match" | "ice_breaker";

export interface AiRecommendationRow {
  id: string;
  user_id: string;
  recommendation_type: RecommendationType;
  target_id: string;
  score: string;
  score_breakdown: Record<string, unknown>;
  ai_explanation: string | null;
  is_dismissed: boolean;
  created_at: string;
}

export async function findFreshRecommendations(
  userId: string,
  type: RecommendationType,
  maxAgeHours: number
): Promise<AiRecommendationRow[]> {
  const result = await query<AiRecommendationRow>(
    `SELECT * FROM ai_recommendations
     WHERE user_id = $1 AND recommendation_type = $2 AND is_dismissed = false
       AND created_at >= now() - ($3 || ' hours')::interval
     ORDER BY score DESC`,
    [userId, type, maxAgeHours]
  );
  return result.rows;
}

export async function findFreshRecommendationForTarget(
  userId: string,
  type: RecommendationType,
  targetId: string,
  maxAgeHours: number
): Promise<AiRecommendationRow | null> {
  const result = await query<AiRecommendationRow>(
    `SELECT * FROM ai_recommendations
     WHERE user_id = $1 AND recommendation_type = $2 AND target_id = $3
       AND created_at >= now() - ($4 || ' hours')::interval
     ORDER BY created_at DESC LIMIT 1`,
    [userId, type, targetId, maxAgeHours]
  );
  return result.rows[0] ?? null;
}

export async function saveRecommendation(input: {
  userId: string;
  type: RecommendationType;
  targetId: string;
  score: number;
  scoreBreakdown: Record<string, unknown>;
  aiExplanation: string;
}): Promise<AiRecommendationRow> {
  const result = await query<AiRecommendationRow>(
    `INSERT INTO ai_recommendations (user_id, recommendation_type, target_id, score, score_breakdown, ai_explanation)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.userId, input.type, input.targetId, input.score, input.scoreBreakdown, input.aiExplanation]
  );
  return result.rows[0];
}

export async function dismissRecommendation(userId: string, type: RecommendationType, targetId: string): Promise<void> {
  await query(
    `UPDATE ai_recommendations SET is_dismissed = true
     WHERE user_id = $1 AND recommendation_type = $2 AND target_id = $3`,
    [userId, type, targetId]
  );
}
