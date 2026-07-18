import { supabase, unwrap } from "../db/supabase-client.js";

export interface SearchResults {
  users: { id: string; firstName: string; lastName: string; avatarUrl: string | null; jobTitle: string | null }[];
  communities: { id: string; slug: string; name: string; description: string | null; coverImageUrl: string | null }[];
  events: { id: string; title: string; startsAt: string }[];
  posts: { id: string; body: string; communityId: string | null }[];
}

export async function globalSearch(q: string, limit = 5): Promise<SearchResults> {
  const like = `%${q.toLowerCase()}%`;

  const [users, communities, events, posts] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name, avatar_url, job_title")
      .eq("is_active", true)
      .or(`first_name.ilike.${like},last_name.ilike.${like}`)
      .order("first_name")
      .limit(limit),
    supabase
      .from("communities")
      .select("id, slug, name, description, cover_image_url")
      .eq("is_archived", false)
      .or(`name.ilike.${like},description.ilike.${like}`)
      .order("name")
      .limit(limit),
    supabase
      .from("events")
      .select("id, title, starts_at")
      .eq("status", "scheduled")
      .ilike("title", like)
      .order("starts_at", { ascending: true })
      .limit(limit),
    supabase
      .from("posts")
      .select("id, body, community_id")
      .is("deleted_at", null)
      .ilike("body", like)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const userRows = unwrap(users) as { id: string; first_name: string; last_name: string; avatar_url: string | null; job_title: string | null }[];
  const communityRows = unwrap(communities) as {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    cover_image_url: string | null;
  }[];
  const eventRows = unwrap(events) as { id: string; title: string; starts_at: string }[];
  const postRows = unwrap(posts) as { id: string; body: string; community_id: string | null }[];

  return {
    users: userRows.map((u) => ({ id: u.id, firstName: u.first_name, lastName: u.last_name, avatarUrl: u.avatar_url, jobTitle: u.job_title })),
    communities: communityRows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      coverImageUrl: c.cover_image_url,
    })),
    events: eventRows.map((e) => ({ id: e.id, title: e.title, startsAt: e.starts_at })),
    posts: postRows.map((p) => ({ id: p.id, body: p.body, communityId: p.community_id })),
  };
}
