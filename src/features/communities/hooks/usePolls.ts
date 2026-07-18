import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/polls";

export function usePoll(postId: string, enabled: boolean) {
  return useQuery({ queryKey: ["poll", postId], queryFn: () => api.getPoll(postId), enabled: enabled && !!postId });
}

export function useCreatePoll(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { question: string; options: string[]; allowMultipleChoices: boolean; closesAt?: string }) =>
      api.createPoll(slug, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", slug] }),
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, optionIds }: { postId: string; optionIds: string[] }) => api.votePoll(postId, optionIds),
    onSuccess: (poll) => queryClient.setQueryData(["poll", poll.postId], poll),
  });
}

export function useClosePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.closePoll(postId),
    onSuccess: (poll) => queryClient.setQueryData(["poll", poll.postId], poll),
  });
}
