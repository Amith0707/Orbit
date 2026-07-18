import { api } from "@/lib/http/apiClient";

export type ReactionType = "like" | "celebrate" | "support" | "love" | "insightful" | "curious";

export interface Post {
  id: string;
  communityId: string | null;
  body: string;
  imageUrl: string | null;
  isPinned: boolean;
  hasPoll: boolean;
  commentCount: number;
  reactionCount: number;
  viewerReaction: ReactionType | null;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  createdAt: string;
}

export async function listPosts(slug: string, params: { limit?: number; offset?: number } = {}) {
  const { data } = await api.get<{ posts: Post[]; total: number }>(`/communities/${slug}/posts`, { params });
  return data;
}

export async function createPost(slug: string, input: { body: string; imageUrl?: string }): Promise<Post> {
  const { data } = await api.post<{ post: Post }>(`/communities/${slug}/posts`, input);
  return data.post;
}

export async function getPost(postId: string): Promise<Post> {
  const { data } = await api.get<{ post: Post }>(`/posts/${postId}`);
  return data.post;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}

export async function pinPost(postId: string): Promise<Post> {
  const { data } = await api.post<{ post: Post }>(`/posts/${postId}/pin`);
  return data.post;
}

export async function unpinPost(postId: string): Promise<Post> {
  const { data } = await api.post<{ post: Post }>(`/posts/${postId}/unpin`);
  return data.post;
}

export async function reactToPost(postId: string, reactionType: ReactionType): Promise<Post> {
  const { data } = await api.post<{ post: Post }>(`/posts/${postId}/reactions`, { reactionType });
  return data.post;
}

export async function removeReaction(postId: string): Promise<Post> {
  const { data } = await api.delete<{ post: Post }>(`/posts/${postId}/reactions`);
  return data.post;
}

export async function listComments(postId: string): Promise<Comment[]> {
  const { data } = await api.get<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  return data.comments;
}

export async function createComment(postId: string, body: string): Promise<Comment> {
  const { data } = await api.post<{ comment: Comment }>(`/posts/${postId}/comments`, { body });
  return data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/posts/comments/${commentId}`);
}
