import { api } from "@/lib/http/apiClient";
import type { Role } from "@/features/auth/types";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: Role;
  department: { id: string; name: string | null } | null;
  jobTitle: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isArchived: boolean;
  memberCount: number;
  createdAt: string;
}

export interface AdminModerationPost {
  id: string;
  body: string;
  imageUrl: string | null;
  communityId: string;
  communityName: string;
  isPinned: boolean;
  commentCount: number;
  reactionCount: number;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  createdAt: string;
}

export async function listUsers(params: {
  search?: string;
  role?: Role;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<{ total: number; users: AdminUser[] }>("/admin/users", { params });
  return data;
}

export async function setUserRole(userId: string, role: Role): Promise<AdminUser> {
  const { data } = await api.patch<{ user: AdminUser }>(`/admin/users/${userId}/role`, { role });
  return data.user;
}

export async function setUserActive(userId: string, isActive: boolean): Promise<AdminUser> {
  const { data } = await api.patch<{ user: AdminUser }>(`/admin/users/${userId}/status`, { isActive });
  return data.user;
}

export async function listCommunities(params: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ total: number; communities: AdminCommunity[] }>("/admin/communities", { params });
  return data;
}

export async function setCommunityArchived(communityId: string, isArchived: boolean): Promise<AdminCommunity> {
  const { data } = await api.patch<{ community: AdminCommunity }>(`/admin/communities/${communityId}/archived`, {
    isArchived,
  });
  return data.community;
}

export async function listModerationPosts(params: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ total: number; posts: AdminModerationPost[] }>("/admin/moderation/posts", {
    params,
  });
  return data;
}

export async function deleteModerationPost(postId: string): Promise<void> {
  await api.delete(`/admin/moderation/posts/${postId}`);
}
