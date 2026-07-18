import { supabase, unwrap, unwrapCount } from "../db/supabase-client.js";

export interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  created_by: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityWithStats extends CommunityRow {
  member_count: string;
  viewer_role: string | null;
}

const COMMUNITY_COLUMNS = "id, name, slug, description, cover_image_url, created_by, is_archived, created_at, updated_at";

export async function createCommunity(input: {
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  createdBy: string;
}): Promise<CommunityRow> {
  const rows = unwrap(
    await supabase
      .from("communities")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        created_by: input.createdBy,
      })
      .select(COMMUNITY_COLUMNS)
  ) as unknown as CommunityRow[];
  return rows[0];
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = unwrap(await supabase.from("communities").select("id").eq("slug", slug));
  return rows.length > 0;
}

export async function findCommunityBySlug(slug: string): Promise<CommunityRow | null> {
  const rows = unwrap(
    await supabase.from("communities").select(COMMUNITY_COLUMNS).eq("slug", slug)
  ) as unknown as CommunityRow[];
  return rows[0] ?? null;
}

export async function findCommunityById(id: string): Promise<CommunityRow | null> {
  const rows = unwrap(
    await supabase.from("communities").select(COMMUNITY_COLUMNS).eq("id", id)
  ) as unknown as CommunityRow[];
  return rows[0] ?? null;
}

export interface ListCommunitiesFilters {
  search?: string;
  viewerId: string;
  joinedOnly?: boolean;
  excludeArchived?: boolean;
  limit: number;
  offset: number;
}

type RpcCommunityRow = CommunityRow & { member_count: number; viewer_role: string | null; total_count?: number };

function toCommunityWithStats(row: RpcCommunityRow): CommunityWithStats {
  return { ...row, member_count: String(row.member_count) };
}

export async function listCommunities(filters: ListCommunitiesFilters): Promise<{ rows: CommunityWithStats[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("list_communities", {
      p_viewer_id: filters.viewerId,
      p_search: filters.search ? `%${filters.search.toLowerCase()}%` : null,
      p_joined_only: filters.joinedOnly ?? false,
      p_limit: filters.limit,
      p_offset: filters.offset,
    })
  ) as (RpcCommunityRow & { total_count: number })[];

  return {
    rows: rows.map(toCommunityWithStats),
    total: rows[0]?.total_count ?? 0,
  };
}

export async function listCommunitiesForUser(userId: string): Promise<CommunityWithStats[]> {
  const rows = unwrap(await supabase.rpc("list_communities_for_user", { p_user_id: userId })) as RpcCommunityRow[];
  return rows.map(toCommunityWithStats);
}

export async function joinCommunity(communityId: string, userId: string, role: "member" | "owner" = "member"): Promise<void> {
  unwrap(
    await supabase
      .from("community_members")
      .upsert({ community_id: communityId, user_id: userId, role }, { onConflict: "community_id,user_id", ignoreDuplicates: true })
  );
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  unwrap(await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", userId));
}

export async function getMembership(communityId: string, userId: string): Promise<{ role: string } | null> {
  const rows = unwrap(
    await supabase.from("community_members").select("role").eq("community_id", communityId).eq("user_id", userId)
  ) as { role: string }[];
  return rows[0] ?? null;
}

export interface CommunityMemberRow {
  user_id: string;
  role: string;
  joined_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_title: string | null;
}

export async function listCommunityMembers(communityId: string): Promise<CommunityMemberRow[]> {
  const rows = unwrap(
    await supabase
      .from("community_members")
      .select("user_id, role, joined_at, user:users(first_name, last_name, avatar_url, job_title)")
      .eq("community_id", communityId)
  ) as unknown as {
    user_id: string;
    role: string;
    joined_at: string;
    user: { first_name: string; last_name: string; avatar_url: string | null; job_title: string | null };
  }[];

  return rows
    .map((r) => ({
      user_id: r.user_id,
      role: r.role,
      joined_at: r.joined_at,
      first_name: r.user.first_name,
      last_name: r.user.last_name,
      avatar_url: r.user.avatar_url,
      job_title: r.user.job_title,
    }))
    .sort((a, b) => {
      const rank = (role: string) => (role === "owner" ? 0 : role === "moderator" ? 1 : 2);
      const diff = rank(a.role) - rank(b.role);
      return diff !== 0 ? diff : new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });
}

export async function adminListCommunities(limit: number, offset: number): Promise<{ rows: CommunityWithStats[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("admin_list_communities", { p_limit: limit, p_offset: offset })
  ) as (RpcCommunityRow & { total_count: number })[];

  return {
    rows: rows.map((r) => ({ ...toCommunityWithStats(r), viewer_role: null })),
    total: rows[0]?.total_count ?? 0,
  };
}

export async function setCommunityArchived(communityId: string, isArchived: boolean): Promise<CommunityRow | null> {
  const rows = unwrap(
    await supabase
      .from("communities")
      .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
      .eq("id", communityId)
      .select(COMMUNITY_COLUMNS)
  ) as unknown as CommunityRow[];
  return rows[0] ?? null;
}

export async function countCommunityMembers(communityId: string): Promise<number> {
  return unwrapCount(
    await supabase.from("community_members").select("*", { count: "exact", head: true }).eq("community_id", communityId)
  );
}
