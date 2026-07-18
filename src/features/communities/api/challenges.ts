import { api } from "@/lib/http/apiClient";

export interface Challenge {
  id: string;
  communityId: string;
  title: string;
  description: string;
  goalMetric: string | null;
  goalTarget: number | null;
  startsAt: string;
  endsAt: string;
  status: "draft" | "active" | "completed" | "archived";
  source: "manual" | "ai_generated";
  participantCount: number;
  createdAt: string;
}

export async function listChallenges(slug: string): Promise<Challenge[]> {
  const { data } = await api.get<{ challenges: Challenge[] }>(`/communities/${slug}/challenges`);
  return data.challenges;
}

export async function createChallenge(
  slug: string,
  input: { title: string; description: string; goalMetric?: string; goalTarget?: number; startsAt: string; endsAt: string }
): Promise<Challenge> {
  const { data } = await api.post<{ challenge: Challenge }>(`/communities/${slug}/challenges`, input);
  return data.challenge;
}

export async function generateChallenge(slug: string): Promise<Challenge> {
  const { data } = await api.post<{ challenge: Challenge }>(`/communities/${slug}/challenges/generate`);
  return data.challenge;
}

export async function joinChallenge(challengeId: string): Promise<Challenge> {
  const { data } = await api.post<{ challenge: Challenge }>(`/challenges/${challengeId}/join`);
  return data.challenge;
}

export async function publishChallenge(challengeId: string): Promise<Challenge> {
  const { data } = await api.post<{ challenge: Challenge }>(`/challenges/${challengeId}/publish`);
  return data.challenge;
}
