import { api } from "@/lib/http/apiClient";

export interface BuddyThread {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface BuddyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function listThreads(): Promise<BuddyThread[]> {
  const { data } = await api.get<{ threads: BuddyThread[] }>("/ai/buddy/threads");
  return data.threads;
}

export async function createThread(): Promise<BuddyThread> {
  const { data } = await api.post<{ thread: BuddyThread }>("/ai/buddy/threads");
  return data.thread;
}

export async function getThread(conversationId: string): Promise<{ id: string; title: string; messages: BuddyMessage[] }> {
  const { data } = await api.get<{ thread: { id: string; title: string; messages: BuddyMessage[] } }>(
    `/ai/buddy/threads/${conversationId}`
  );
  return data.thread;
}
