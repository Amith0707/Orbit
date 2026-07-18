import { api } from "@/lib/http/apiClient";

export interface IceBreakerResult {
  targetUserId: string;
  sharedInterests: string[];
  sharedHobbies: string[];
  sharedSkills: string[];
  commonalities: string[];
  conversationStarters: string[];
  cached: boolean;
}

export async function getIceBreaker(userId: string, force = false): Promise<IceBreakerResult> {
  const { data } = await api.get<{ iceBreaker: IceBreakerResult }>(`/ai/ice-breaker/${userId}`, {
    params: force ? { force: true } : undefined,
  });
  return data.iceBreaker;
}
