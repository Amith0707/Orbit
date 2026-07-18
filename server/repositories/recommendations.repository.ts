import { supabase, unwrap } from "../db/supabase-client.js";

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
  const rows = unwrap(
    await supabase.rpc("list_candidate_communities", { p_user_id: userId, p_department_id: departmentId })
  ) as (Omit<CandidateCommunityRow, "member_count" | "coworker_count"> & { member_count: number; coworker_count: number })[];

  return rows.map((r) => ({ ...r, member_count: String(r.member_count), coworker_count: String(r.coworker_count) }));
}

export interface CandidateCoworkerRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  availability: string | null;
  shared_community_count: string;
  shared_upcoming_event_count: string;
}

export async function listCandidateCoworkers(userId: string, limit: number): Promise<CandidateCoworkerRow[]> {
  const rows = unwrap(
    await supabase.rpc("list_candidate_coworkers", { p_user_id: userId, p_limit: limit })
  ) as (Omit<CandidateCoworkerRow, "shared_community_count" | "shared_upcoming_event_count"> & {
    shared_community_count: number;
    shared_upcoming_event_count: number;
  })[];

  return rows.map((r) => ({
    ...r,
    shared_community_count: String(r.shared_community_count),
    shared_upcoming_event_count: String(r.shared_upcoming_event_count),
  }));
}
