import { supabase, unwrap } from "../db/supabase-client.js";

export type TagKind = "interest" | "hobby" | "skill";

export interface TagRow {
  id: string;
  kind: TagKind;
  name: string;
}

export async function listTags(kind?: TagKind): Promise<TagRow[]> {
  let q = supabase.from("tags").select("id, kind, name");
  q = kind ? q.eq("kind", kind).order("name") : q.order("kind").order("name");
  return unwrap(await q) as unknown as TagRow[];
}

export async function findOrCreateTag(kind: TagKind, name: string): Promise<TagRow> {
  const trimmed = name.trim();
  const existingRows = unwrap(
    await supabase.from("tags").select("id, kind, name").eq("kind", kind).ilike("name", trimmed)
  ) as unknown as TagRow[];
  if (existingRows[0]) return existingRows[0];

  const created = unwrap(
    await supabase
      .from("tags")
      .upsert({ kind, name: trimmed }, { onConflict: "kind,name" })
      .select("id, kind, name")
  ) as unknown as TagRow[];
  return created[0];
}

export async function getUserTags(userId: string): Promise<TagRow[]> {
  const rows = unwrap(
    await supabase.from("user_tags").select("tag:tags(id, kind, name)").eq("user_id", userId)
  ) as unknown as { tag: TagRow }[];
  return rows.map((r) => r.tag).sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

export async function getUserTagsForUsers(userIds: string[]): Promise<Map<string, TagRow[]>> {
  if (userIds.length === 0) return new Map();
  const rows = unwrap(
    await supabase.from("user_tags").select("user_id, tag:tags(id, kind, name)").in("user_id", userIds)
  ) as unknown as { user_id: string; tag: TagRow }[];

  const map = new Map<string, TagRow[]>();
  for (const row of rows) {
    const list = map.get(row.user_id) ?? [];
    list.push(row.tag);
    map.set(row.user_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  }
  return map;
}

export async function setUserTags(userId: string, tagIds: string[]): Promise<void> {
  unwrap(await supabase.from("user_tags").delete().eq("user_id", userId));
  if (tagIds.length === 0) return;
  unwrap(await supabase.from("user_tags").insert(tagIds.map((tagId) => ({ user_id: userId, tag_id: tagId }))));
}

export async function getCommunityTagsForCommunities(communityIds: string[]): Promise<Map<string, TagRow[]>> {
  if (communityIds.length === 0) return new Map();
  const rows = unwrap(
    await supabase
      .from("community_tags")
      .select("community_id, tag:tags(id, kind, name)")
      .in("community_id", communityIds)
  ) as unknown as { community_id: string; tag: TagRow }[];

  const map = new Map<string, TagRow[]>();
  for (const row of rows) {
    const list = map.get(row.community_id) ?? [];
    list.push(row.tag);
    map.set(row.community_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  }
  return map;
}

export async function getCommunityTags(communityId: string): Promise<TagRow[]> {
  const rows = unwrap(
    await supabase.from("community_tags").select("tag:tags(id, kind, name)").eq("community_id", communityId)
  ) as unknown as { tag: TagRow }[];
  return rows.map((r) => r.tag).sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

export async function setCommunityTags(communityId: string, tagIds: string[]): Promise<void> {
  unwrap(await supabase.from("community_tags").delete().eq("community_id", communityId));
  if (tagIds.length === 0) return;
  unwrap(
    await supabase.from("community_tags").insert(tagIds.map((tagId) => ({ community_id: communityId, tag_id: tagId })))
  );
}
