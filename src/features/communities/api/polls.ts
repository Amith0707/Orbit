import { api } from "@/lib/http/apiClient";

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
  percentage: number;
}

export interface Poll {
  id: string;
  postId: string | null;
  question: string;
  allowMultipleChoices: boolean;
  closesAt: string | null;
  isClosed: boolean;
  isPastDeadline: boolean;
  aiSummary: string | null;
  totalVoters: number;
  viewerVoteOptionIds: string[];
  options: PollOption[];
}

export async function createPoll(
  slug: string,
  input: { question: string; options: string[]; allowMultipleChoices: boolean; closesAt?: string }
): Promise<Poll> {
  const { data } = await api.post<{ poll: Poll }>(`/communities/${slug}/polls`, input);
  return data.poll;
}

export async function getPoll(postId: string): Promise<Poll> {
  const { data } = await api.get<{ poll: Poll }>(`/posts/${postId}/poll`);
  return data.poll;
}

export async function votePoll(postId: string, optionIds: string[]): Promise<Poll> {
  const { data } = await api.post<{ poll: Poll }>(`/posts/${postId}/poll/vote`, { optionIds });
  return data.poll;
}

export async function closePoll(postId: string): Promise<Poll> {
  const { data } = await api.post<{ poll: Poll }>(`/posts/${postId}/poll/close`);
  return data.poll;
}
