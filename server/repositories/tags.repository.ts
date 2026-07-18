import { query } from "../db/client.js";

export type TagKind = "interest" | "hobby" | "skill";

export interface TagRow {
  id: string;
  kind: TagKind;
  name: string;
}

export async function listTags(kind?: TagKind): Promise<TagRow[]> {
  if (kind) {
    const result = await query<TagRow>(`SELECT id, kind, name FROM tags WHERE kind = $1 ORDER BY name`, [kind]);
    return result.rows;
  }
  const result = await query<TagRow>(`SELECT id, kind, name FROM tags ORDER BY kind, name`);
  return result.rows;
}

export async function findOrCreateTag(kind: TagKind, name: string): Promise<TagRow> {
  const trimmed = name.trim();
  const existing = await query<TagRow>(`SELECT id, kind, name FROM tags WHERE kind = $1 AND LOWER(name) = LOWER($2)`, [
    kind,
    trimmed,
  ]);
  if (existing.rows[0]) return existing.rows[0];

  const created = await query<TagRow>(
    `INSERT INTO tags (kind, name) VALUES ($1, $2) ON CONFLICT (kind, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, kind, name`,
    [kind, trimmed]
  );
  return created.rows[0];
}

export async function getUserTags(userId: string): Promise<TagRow[]> {
  const result = await query<TagRow>(
    `SELECT t.id, t.kind, t.name FROM tags t
     JOIN user_tags ut ON ut.tag_id = t.id
     WHERE ut.user_id = $1
     ORDER BY t.kind, t.name`,
    [userId]
  );
  return result.rows;
}

export async function getUserTagsForUsers(userIds: string[]): Promise<Map<string, TagRow[]>> {
  if (userIds.length === 0) return new Map();
  const result = await query<TagRow & { user_id: string }>(
    `SELECT ut.user_id, t.id, t.kind, t.name FROM tags t
     JOIN user_tags ut ON ut.tag_id = t.id
     WHERE ut.user_id = ANY($1::uuid[])
     ORDER BY t.kind, t.name`,
    [userIds]
  );
  const map = new Map<string, TagRow[]>();
  for (const row of result.rows) {
    const list = map.get(row.user_id) ?? [];
    list.push({ id: row.id, kind: row.kind, name: row.name });
    map.set(row.user_id, list);
  }
  return map;
}

export async function setUserTags(userId: string, tagIds: string[]): Promise<void> {
  await query(`DELETE FROM user_tags WHERE user_id = $1`, [userId]);
  if (tagIds.length === 0) return;
  const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(", ");
  await query(`INSERT INTO user_tags (user_id, tag_id) VALUES ${values}`, [userId, ...tagIds]);
}

export async function getCommunityTagsForCommunities(communityIds: string[]): Promise<Map<string, TagRow[]>> {
  if (communityIds.length === 0) return new Map();
  const result = await query<TagRow & { community_id: string }>(
    `SELECT ct.community_id, t.id, t.kind, t.name FROM tags t
     JOIN community_tags ct ON ct.tag_id = t.id
     WHERE ct.community_id = ANY($1::uuid[])
     ORDER BY t.kind, t.name`,
    [communityIds]
  );
  const map = new Map<string, TagRow[]>();
  for (const row of result.rows) {
    const list = map.get(row.community_id) ?? [];
    list.push({ id: row.id, kind: row.kind, name: row.name });
    map.set(row.community_id, list);
  }
  return map;
}

export async function getCommunityTags(communityId: string): Promise<TagRow[]> {
  const result = await query<TagRow>(
    `SELECT t.id, t.kind, t.name FROM tags t
     JOIN community_tags ct ON ct.tag_id = t.id
     WHERE ct.community_id = $1
     ORDER BY t.kind, t.name`,
    [communityId]
  );
  return result.rows;
}

export async function setCommunityTags(communityId: string, tagIds: string[]): Promise<void> {
  await query(`DELETE FROM community_tags WHERE community_id = $1`, [communityId]);
  if (tagIds.length === 0) return;
  const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(", ");
  await query(`INSERT INTO community_tags (community_id, tag_id) VALUES ${values}`, [communityId, ...tagIds]);
}
