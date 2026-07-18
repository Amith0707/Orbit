import { api } from "@/lib/http/apiClient";

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  createdBy: string | null;
  isArchived: boolean;
  memberCount?: number;
  viewerRole?: "member" | "moderator" | "owner";
  tags: { id: string; kind: string; name: string }[];
  createdAt: string;
}

export async function listCommunities(params: { search?: string; joinedOnly?: boolean; limit?: number; offset?: number }) {
  const { data } = await api.get<{ communities: Community[]; total: number }>("/communities", { params });
  return data;
}

export async function listMyCommunities(): Promise<Community[]> {
  const { data } = await api.get<{ communities: Community[] }>("/communities/mine");
  return data.communities;
}

export async function getCommunity(slug: string): Promise<Community> {
  const { data } = await api.get<{ community: Community }>(`/communities/${slug}`);
  return data.community;
}

export async function createCommunity(input: { name: string; description?: string; tagIds?: string[] }): Promise<Community> {
  const { data } = await api.post<{ community: Community }>("/communities", input);
  return data.community;
}

export async function joinCommunity(slug: string): Promise<Community> {
  const { data } = await api.post<{ community: Community }>(`/communities/${slug}/join`);
  return data.community;
}

export async function leaveCommunity(slug: string): Promise<void> {
  await api.post(`/communities/${slug}/leave`);
}

export interface CommunityMember {
  userId: string;
  role: string;
  joinedAt: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
}

export async function listCommunityMembers(slug: string): Promise<CommunityMember[]> {
  const { data } = await api.get<{ members: CommunityMember[] }>(`/communities/${slug}/members`);
  return data.members;
}
