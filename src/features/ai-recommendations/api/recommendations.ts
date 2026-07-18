import { api } from "@/lib/http/apiClient";

export interface CommunityRecommendation {
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  score: number;
  explanation: string;
}

export async function getCommunityRecommendations(force = false): Promise<CommunityRecommendation[]> {
  const { data } = await api.get<{ recommendations: CommunityRecommendation[] }>("/ai/recommendations/communities", {
    params: force ? { force: true } : undefined,
  });
  return data.recommendations;
}

export async function dismissCommunityRecommendation(communityId: string): Promise<void> {
  await api.post(`/ai/recommendations/communities/${communityId}/dismiss`);
}
