import { query } from "../db/client.js";

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

export async function createCommunity(input: {
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  createdBy: string;
}): Promise<CommunityRow> {
  const result = await query<CommunityRow>(
    `INSERT INTO communities (name, slug, description, cover_image_url, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.name, input.slug, input.description ?? null, input.coverImageUrl ?? null, input.createdBy]
  );
  return result.rows[0];
}

export async function slugExists(slug: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM communities WHERE slug = $1`, [slug]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function findCommunityBySlug(slug: string): Promise<CommunityRow | null> {
  const result = await query<CommunityRow>(`SELECT * FROM communities WHERE slug = $1`, [slug]);
  return result.rows[0] ?? null;
}

export async function findCommunityById(id: string): Promise<CommunityRow | null> {
  const result = await query<CommunityRow>(`SELECT * FROM communities WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export interface ListCommunitiesFilters {
  search?: string;
  viewerId: string;
  joinedOnly?: boolean;
  excludeArchived?: boolean;
  limit: number;
  offset: number;
}

function buildCommunityConditions(filters: ListCommunitiesFilters, params: unknown[], viewerParamIndex: number) {
  const conditions: string[] = [];

  if (filters.excludeArchived !== false) {
    conditions.push(`c.is_archived = false`);
  }
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(`(LOWER(c.name) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length})`);
  }
  if (filters.joinedOnly) {
    conditions.push(
      `EXISTS (SELECT 1 FROM community_members m WHERE m.community_id = c.id AND m.user_id = $${viewerParamIndex})`
    );
  }

  return conditions;
}

export async function listCommunities(filters: ListCommunitiesFilters): Promise<{ rows: CommunityWithStats[]; total: number }> {
  // The count query only needs viewerId when joinedOnly actually references it.
  const countParams: unknown[] = filters.joinedOnly ? [filters.viewerId] : [];
  const countConditions = buildCommunityConditions(filters, countParams, 1);
  const countWhereClause = countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : "";
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM communities c ${countWhereClause}`,
    countParams
  );

  // The row query always needs viewerId at $1 for the viewer_role subquery.
  const params: unknown[] = [filters.viewerId];
  const conditions = buildCommunityConditions(filters, params, 1);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(filters.limit, filters.offset);
  const rowsResult = await query<CommunityWithStats>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
       (SELECT m.role FROM community_members m WHERE m.community_id = c.id AND m.user_id = $1) AS viewer_role
     FROM communities c
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function listCommunitiesForUser(userId: string): Promise<CommunityWithStats[]> {
  const result = await query<CommunityWithStats>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM community_members m2 WHERE m2.community_id = c.id) AS member_count,
       m.role AS viewer_role
     FROM communities c
     JOIN community_members m ON m.community_id = c.id AND m.user_id = $1
     WHERE c.is_archived = false
     ORDER BY m.joined_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function joinCommunity(communityId: string, userId: string, role: "member" | "owner" = "member"): Promise<void> {
  await query(
    `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (community_id, user_id) DO NOTHING`,
    [communityId, userId, role]
  );
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  await query(`DELETE FROM community_members WHERE community_id = $1 AND user_id = $2`, [communityId, userId]);
}

export async function getMembership(communityId: string, userId: string): Promise<{ role: string } | null> {
  const result = await query<{ role: string }>(
    `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId]
  );
  return result.rows[0] ?? null;
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
  const result = await query<CommunityMemberRow>(
    `SELECT m.user_id, m.role, m.joined_at, u.first_name, u.last_name, u.avatar_url, u.job_title
     FROM community_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.community_id = $1
     ORDER BY (m.role = 'owner') DESC, (m.role = 'moderator') DESC, m.joined_at ASC`,
    [communityId]
  );
  return result.rows;
}

export async function adminListCommunities(limit: number, offset: number): Promise<{ rows: CommunityWithStats[]; total: number }> {
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM communities`);
  const rowsResult = await query<CommunityWithStats>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM community_members m WHERE m.community_id = c.id) AS member_count,
       NULL AS viewer_role
     FROM communities c
     ORDER BY c.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function setCommunityArchived(communityId: string, isArchived: boolean): Promise<CommunityRow | null> {
  const result = await query<CommunityRow>(
    `UPDATE communities SET is_archived = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [communityId, isArchived]
  );
  return result.rows[0] ?? null;
}

export async function countCommunityMembers(communityId: string): Promise<number> {
  const result = await query<{ count: string }>(`SELECT COUNT(*) FROM community_members WHERE community_id = $1`, [
    communityId,
  ]);
  return Number.parseInt(result.rows[0].count, 10);
}
