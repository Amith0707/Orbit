import { query } from "../db/client.js";

export interface PostRow {
  id: string;
  community_id: string | null;
  author_id: string;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostWithAuthor extends PostRow {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  comment_count: string;
  reaction_count: string;
  viewer_reaction: string | null;
  has_poll: boolean;
}

const POST_SELECT = `
  SELECT p.*, u.first_name, u.last_name, u.avatar_url,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
    (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) AS reaction_count,
    (SELECT r.reaction_type FROM post_reactions r WHERE r.post_id = p.id AND r.user_id = $1) AS viewer_reaction,
    EXISTS (SELECT 1 FROM polls pl WHERE pl.post_id = p.id) AS has_poll
  FROM posts p
  JOIN users u ON u.id = p.author_id
`;

export async function createPost(input: {
  communityId: string | null;
  authorId: string;
  body: string;
  imageUrl?: string;
}): Promise<PostRow> {
  const result = await query<PostRow>(
    `INSERT INTO posts (community_id, author_id, body, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.communityId, input.authorId, input.body, input.imageUrl ?? null]
  );
  return result.rows[0];
}

export async function findPostById(postId: string, viewerId: string): Promise<PostWithAuthor | null> {
  const result = await query<PostWithAuthor>(
    `${POST_SELECT} WHERE p.id = $2 AND p.deleted_at IS NULL`,
    [viewerId, postId]
  );
  return result.rows[0] ?? null;
}

export async function listCommunityPosts(
  communityId: string,
  viewerId: string,
  limit: number,
  offset: number
): Promise<{ rows: PostWithAuthor[]; total: number }> {
  const [rowsResult, countResult] = await Promise.all([
    query<PostWithAuthor>(
      `${POST_SELECT}
       WHERE p.community_id = $2 AND p.deleted_at IS NULL
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [viewerId, communityId, limit, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) FROM posts WHERE community_id = $1 AND deleted_at IS NULL`, [communityId]),
  ]);
  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function setPinned(postId: string, isPinned: boolean): Promise<void> {
  await query(`UPDATE posts SET is_pinned = $2, updated_at = now() WHERE id = $1`, [postId, isPinned]);
}

export async function softDeletePost(postId: string): Promise<void> {
  await query(`UPDATE posts SET deleted_at = now() WHERE id = $1`, [postId]);
}

export async function upsertReaction(postId: string, userId: string, reactionType: string): Promise<void> {
  await query(
    `INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id) DO UPDATE SET reaction_type = EXCLUDED.reaction_type, created_at = now()`,
    [postId, userId, reactionType]
  );
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  await query(`DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
}): Promise<CommentRow> {
  const result = await query<CommentRow>(
    `WITH inserted AS (
       INSERT INTO comments (post_id, author_id, body, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT inserted.*, u.first_name, u.last_name, u.avatar_url
     FROM inserted JOIN users u ON u.id = inserted.author_id`,
    [input.postId, input.authorId, input.body, input.parentCommentId ?? null]
  );
  return result.rows[0];
}

export async function listComments(postId: string): Promise<CommentRow[]> {
  const result = await query<CommentRow>(
    `SELECT c.*, u.first_name, u.last_name, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.author_id
     WHERE c.post_id = $1 AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return result.rows;
}

export interface AdminPostRow extends PostWithAuthor {
  community_name: string | null;
}

export async function adminListRecentPosts(limit: number, offset: number): Promise<{ rows: AdminPostRow[]; total: number }> {
  const [rowsResult, countResult] = await Promise.all([
    query<AdminPostRow>(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url, c.name AS community_name,
         (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.deleted_at IS NULL) AS comment_count,
         (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) AS reaction_count,
         NULL AS viewer_reaction,
         EXISTS (SELECT 1 FROM polls pl WHERE pl.post_id = p.id) AS has_poll
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN communities c ON c.id = p.community_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL`),
  ]);
  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function findCommentById(commentId: string): Promise<{ id: string; author_id: string; post_id: string } | null> {
  const result = await query<{ id: string; author_id: string; post_id: string }>(
    `SELECT id, author_id, post_id FROM comments WHERE id = $1 AND deleted_at IS NULL`,
    [commentId]
  );
  return result.rows[0] ?? null;
}

export async function softDeleteComment(commentId: string): Promise<void> {
  await query(`UPDATE comments SET deleted_at = now() WHERE id = $1`, [commentId]);
}
