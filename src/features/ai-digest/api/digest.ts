import { api } from "@/lib/http/apiClient";

export interface WeeklyDigest {
  id: string;
  weekStart: string;
  weekEnd: string;
  stats: Record<string, unknown>;
  narrative: string;
  createdAt: string;
}

export async function getDigest(force = false): Promise<WeeklyDigest> {
  const { data } = await api.get<{ digest: WeeklyDigest }>("/ai/digest", { params: force ? { force: true } : undefined });
  return data.digest;
}

export async function getDigestHistory(): Promise<WeeklyDigest[]> {
  const { data } = await api.get<{ digests: WeeklyDigest[] }>("/ai/digest/history");
  return data.digests;
}
