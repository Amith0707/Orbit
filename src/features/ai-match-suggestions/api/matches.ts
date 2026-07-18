import { api } from "@/lib/http/apiClient";

export interface MatchSuggestion {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  score: number;
  explanation: string;
}

export async function getMatchSuggestions(force = false): Promise<MatchSuggestion[]> {
  const { data } = await api.get<{ suggestions: MatchSuggestion[] }>("/ai/recommendations/matches", {
    params: force ? { force: true } : undefined,
  });
  return data.suggestions;
}

export async function dismissMatchSuggestion(userId: string): Promise<void> {
  await api.post(`/ai/recommendations/matches/${userId}/dismiss`);
}
