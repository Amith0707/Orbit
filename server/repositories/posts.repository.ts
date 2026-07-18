import { supabase, unwrap } from "../db/supabase-client.js";

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

type RpcPostRow = PostRow & {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  comment_count: number;
  reaction_count: number;
  viewer_reaction: string | null;
  has_poll: boolean;
  total_count?: number;
};

function toPostWithAuthor(row: RpcPostRow): PostWithAuthor {
  return { ...row, comment_count: String(row.comment_count), reaction_count: String(row.reaction_count) };
}

export async function createPost(input: {
  communityId: string | null;
  authorId: string;
  body: string;
  imageUrl?: string;
}): Promise<PostRow> {
  const rows = unwrap(
    await supabase
      .from("posts")
      .insert({
        community_id: input.communityId,
        author_id: input.authorId,
        body: input.body,
        image_url: input.imageUrl ?? null,
      })
      .select("*")
  ) as unknown as PostRow[];
  return rows[0];
}

export async function findPostById(postId: string, viewerId: string): Promise<PostWithAuthor | null> {
  const rows = unwrap(
    await supabase.rpc("find_post_by_id", { p_post_id: postId, p_viewer_id: viewerId })
  ) as RpcPostRow[];
  return rows[0] ? toPostWithAuthor(rows[0]) : null;
}

export async function listCommunityPosts(
  communityId: string,
  viewerId: string,
  limit: number,
  offset: number
): Promise<{ rows: PostWithAuthor[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("list_community_posts", {
      p_community_id: communityId,
      p_viewer_id: viewerId,
      p_limit: limit,
      p_offset: offset,
    })
  ) as (RpcPostRow & { total_count: number })[];

  return { rows: rows.map(toPostWithAuthor), total: rows[0]?.total_count ?? 0 };
}

export async function setPinned(postId: string, isPinned: boolean): Promise<void> {
  unwrap(await supabase.from("posts").update({ is_pinned: isPinned, updated_at: new Date().toISOString() }).eq("id", postId));
}

export async function softDeletePost(postId: string): Promise<void> {
  unwrap(await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId));
}

export async function upsertReaction(postId: string, userId: string, reactionType: string): Promise<void> {
  unwrap(
    await supabase
      .from("post_reactions")
      .upsert(
        { post_id: postId, user_id: userId, reaction_type: reactionType, created_at: new Date().toISOString() },
        { onConflict: "post_id,user_id" }
      )
  );
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  unwrap(await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId));
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

type EmbeddedComment = Omit<CommentRow, "first_name" | "last_name" | "avatar_url"> & {
  author: { first_name: string; last_name: string; avatar_url: string | null };
};

function flattenComment(row: EmbeddedComment): CommentRow {
  const { author, ...rest } = row;
  return { ...rest, first_name: author.first_name, last_name: author.last_name, avatar_url: author.avatar_url };
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
}): Promise<CommentRow> {
  const rows = unwrap(
    await supabase
      .from("comments")
      .insert({
        post_id: input.postId,
        author_id: input.authorId,
        body: input.body,
        parent_comment_id: input.parentCommentId ?? null,
      })
      .select("*, author:users!author_id(first_name, last_name, avatar_url)")
  ) as unknown as EmbeddedComment[];
  return flattenComment(rows[0]);
}

export async function listComments(postId: string): Promise<CommentRow[]> {
  const rows = unwrap(
    await supabase
      .from("comments")
      .select("*, author:users!author_id(first_name, last_name, avatar_url)")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
  ) as unknown as EmbeddedComment[];
  return rows.map(flattenComment);
}

export interface AdminPostRow extends PostWithAuthor {
  community_name: string | null;
}

export async function adminListRecentPosts(limit: number, offset: number): Promise<{ rows: AdminPostRow[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("admin_list_recent_posts", { p_limit: limit, p_offset: offset })
  ) as (RpcPostRow & { community_name: string | null; total_count: number })[];

  return {
    rows: rows.map((r) => ({ ...toPostWithAuthor(r), community_name: r.community_name })),
    total: rows[0]?.total_count ?? 0,
  };
}

export async function findCommentById(commentId: string): Promise<{ id: string; author_id: string; post_id: string } | null> {
  const rows = unwrap(
    await supabase.from("comments").select("id, author_id, post_id").eq("id", commentId).is("deleted_at", null)
  ) as { id: string; author_id: string; post_id: string }[];
  return rows[0] ?? null;
}

export async function softDeleteComment(commentId: string): Promise<void> {
  unwrap(await supabase.from("comments").update({ deleted_at: new Date().toISOString() }).eq("id", commentId));
}
