import { supabase, unwrap, unwrapCount } from "../db/supabase-client.js";

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
  const rows = unwrap(
    await supabase.from("weekly_digests").select("*").eq("user_id", userId).eq("week_start", weekStart)
  ) as unknown as WeeklyDigestRow[];
  return rows[0] ?? null;
}

export async function createDigest(input: {
  userId: string;
  weekStart: string;
  weekEnd: string;
  stats: Record<string, unknown>;
  narrative: string;
}): Promise<WeeklyDigestRow> {
  const rows = unwrap(
    await supabase
      .from("weekly_digests")
      .insert({
        user_id: input.userId,
        week_start: input.weekStart,
        week_end: input.weekEnd,
        stats: input.stats,
        narrative: input.narrative,
      })
      .select("*")
  ) as unknown as WeeklyDigestRow[];
  return rows[0];
}

export async function listRecentDigests(userId: string, limit = 8): Promise<WeeklyDigestRow[]> {
  return unwrap(
    await supabase
      .from("weekly_digests")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(limit)
  ) as unknown as WeeklyDigestRow[];
}

async function getUserCommunityIds(userId: string): Promise<string[]> {
  const rows = unwrap(
    await supabase.from("community_members").select("community_id").eq("user_id", userId)
  ) as { community_id: string }[];
  return rows.map((r) => r.community_id);
}

export async function countNewPostsForUserCommunities(userId: string, since: string): Promise<number> {
  const communityIds = await getUserCommunityIds(userId);
  if (communityIds.length === 0) return 0;
  return unwrapCount(
    await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", since)
      .in("community_id", communityIds)
  );
}

export interface ActiveChallengeRow {
  title: string;
  community_name: string;
}

export async function listActiveChallengesForUserCommunities(userId: string, limit = 3): Promise<ActiveChallengeRow[]> {
  const communityIds = await getUserCommunityIds(userId);
  if (communityIds.length === 0) return [];

  const rows = unwrap(
    await supabase
      .from("community_challenges")
      .select("title, community:communities(name)")
      .eq("status", "active")
      .in("community_id", communityIds)
      .order("created_at", { ascending: false })
      .limit(limit)
  ) as unknown as { title: string; community: { name: string } }[];

  return rows.map((r) => ({ title: r.title, community_name: r.community.name }));
}
