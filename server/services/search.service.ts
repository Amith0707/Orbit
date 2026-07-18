import { query } from "../db/client.js";

export interface SearchResults {
  users: { id: string; firstName: string; lastName: string; avatarUrl: string | null; jobTitle: string | null }[];
  communities: { id: string; slug: string; name: string; description: string | null; coverImageUrl: string | null }[];
  events: { id: string; title: string; startsAt: string }[];
  posts: { id: string; body: string; communityId: string | null }[];
}

export async function globalSearch(q: string, limit = 5): Promise<SearchResults> {
  const like = `%${q.toLowerCase()}%`;

  const [users, communities, events, posts] = await Promise.all([
    query<{ id: string; first_name: string; last_name: string; avatar_url: string | null; job_title: string | null }>(
      `SELECT id, first_name, last_name, avatar_url, job_title FROM users
       WHERE is_active = true AND LOWER(first_name || ' ' || last_name) LIKE $1
       ORDER BY first_name LIMIT $2`,
      [like, limit]
    ),
    query<{ id: string; slug: string; name: string; description: string | null; cover_image_url: string | null }>(
      `SELECT id, slug, name, description, cover_image_url FROM communities
       WHERE is_archived = false AND (LOWER(name) LIKE $1 OR LOWER(description) LIKE $1)
       ORDER BY name LIMIT $2`,
      [like, limit]
    ),
    query<{ id: string; title: string; starts_at: string }>(
      `SELECT id, title, starts_at FROM events WHERE status = 'scheduled' AND LOWER(title) LIKE $1
       ORDER BY starts_at ASC LIMIT $2`,
      [like, limit]
    ),
    query<{ id: string; body: string; community_id: string | null }>(
      `SELECT id, body, community_id FROM posts WHERE deleted_at IS NULL AND LOWER(body) LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [like, limit]
    ),
  ]);

  return {
    users: users.rows.map((u) => ({ id: u.id, firstName: u.first_name, lastName: u.last_name, avatarUrl: u.avatar_url, jobTitle: u.job_title })),
    communities: communities.rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      coverImageUrl: c.cover_image_url,
    })),
    events: events.rows.map((e) => ({ id: e.id, title: e.title, startsAt: e.starts_at })),
    posts: posts.rows.map((p) => ({ id: p.id, body: p.body, communityId: p.community_id })),
  };
}
