import { supabase, unwrap } from "../db/supabase-client.js";

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

type RawRecommendationRow = Omit<AiRecommendationRow, "score"> & { score: number };

function toRecommendationRow(row: RawRecommendationRow): AiRecommendationRow {
  return { ...row, score: String(row.score) };
}

function cutoffIso(maxAgeHours: number): string {
  return new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
}

export async function findFreshRecommendations(
  userId: string,
  type: RecommendationType,
  maxAgeHours: number
): Promise<AiRecommendationRow[]> {
  const rows = unwrap(
    await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("recommendation_type", type)
      .eq("is_dismissed", false)
      .gte("created_at", cutoffIso(maxAgeHours))
      .order("score", { ascending: false })
  ) as RawRecommendationRow[];
  return rows.map(toRecommendationRow);
}

export async function findFreshRecommendationForTarget(
  userId: string,
  type: RecommendationType,
  targetId: string,
  maxAgeHours: number
): Promise<AiRecommendationRow | null> {
  const rows = unwrap(
    await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("recommendation_type", type)
      .eq("target_id", targetId)
      .gte("created_at", cutoffIso(maxAgeHours))
      .order("created_at", { ascending: false })
      .limit(1)
  ) as RawRecommendationRow[];
  return rows[0] ? toRecommendationRow(rows[0]) : null;
}

export async function saveRecommendation(input: {
  userId: string;
  type: RecommendationType;
  targetId: string;
  score: number;
  scoreBreakdown: Record<string, unknown>;
  aiExplanation: string;
}): Promise<AiRecommendationRow> {
  const rows = unwrap(
    await supabase
      .from("ai_recommendations")
      .insert({
        user_id: input.userId,
        recommendation_type: input.type,
        target_id: input.targetId,
        score: input.score,
        score_breakdown: input.scoreBreakdown,
        ai_explanation: input.aiExplanation,
      })
      .select("*")
  ) as RawRecommendationRow[];
  return toRecommendationRow(rows[0]);
}

export async function dismissRecommendation(userId: string, type: RecommendationType, targetId: string): Promise<void> {
  unwrap(
    await supabase
      .from("ai_recommendations")
      .update({ is_dismissed: true })
      .eq("user_id", userId)
      .eq("recommendation_type", type)
      .eq("target_id", targetId)
  );
}
