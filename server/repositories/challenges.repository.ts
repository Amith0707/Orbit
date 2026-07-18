import { supabase, unwrap, unwrapCount } from "../db/supabase-client.js";

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
  const rows = unwrap(
    await supabase
      .from("community_challenges")
      .insert({
        community_id: input.communityId,
        created_by: input.createdBy,
        title: input.title,
        description: input.description,
        goal_metric: input.goalMetric ?? null,
        goal_target: input.goalTarget ?? null,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: input.status ?? "active",
        source: input.source ?? "manual",
        ai_raw_response: input.aiRawResponse ?? null,
      })
      .select("*")
  ) as unknown as ChallengeRow[];
  return rows[0];
}

export async function listChallengesForCommunity(communityId: string): Promise<ChallengeRow[]> {
  return unwrap(
    await supabase
      .from("community_challenges")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
  ) as unknown as ChallengeRow[];
}

export async function findChallengeById(id: string): Promise<ChallengeRow | null> {
  const rows = unwrap(
    await supabase.from("community_challenges").select("*").eq("id", id)
  ) as unknown as ChallengeRow[];
  return rows[0] ?? null;
}

export async function publishChallenge(id: string): Promise<ChallengeRow> {
  const rows = unwrap(
    await supabase
      .from("community_challenges")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "draft")
      .select("*")
  ) as unknown as ChallengeRow[];
  return rows[0];
}

export async function joinChallenge(challengeId: string, userId: string): Promise<void> {
  unwrap(
    await supabase
      .from("community_challenge_participants")
      .upsert(
        { challenge_id: challengeId, user_id: userId },
        { onConflict: "challenge_id,user_id", ignoreDuplicates: true }
      )
  );
}

export async function countParticipants(challengeId: string): Promise<number> {
  return unwrapCount(
    await supabase
      .from("community_challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId)
  );
}

export async function getRecentTitlesForCommunity(communityId: string, limit = 5): Promise<string[]> {
  const rows = unwrap(
    await supabase
      .from("community_challenges")
      .select("title")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(limit)
  ) as { title: string }[];
  return rows.map((r) => r.title);
}
