import { api } from "@/lib/http/apiClient";

export interface SearchResults {
  users: { id: string; firstName: string; lastName: string; avatarUrl: string | null; jobTitle: string | null }[];
  communities: { id: string; slug: string; name: string; description: string | null; coverImageUrl: string | null }[];
  events: { id: string; title: string; startsAt: string }[];
  posts: { id: string; body: string; communityId: string | null }[];
}

export async function searchAll(q: string, limit = 5): Promise<SearchResults> {
  const { data } = await api.get<{ results: SearchResults }>("/search", { params: { q, limit } });
  return data.results;
}
