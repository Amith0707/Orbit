import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/challenges";

export function useChallenges(slug: string) {
  return useQuery({ queryKey: ["challenges", slug], queryFn: () => api.listChallenges(slug), enabled: !!slug });
}

export function useCreateChallenge(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description: string; goalMetric?: string; goalTarget?: number; startsAt: string; endsAt: string }) =>
      api.createChallenge(slug, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["challenges", slug] }),
  });
}

export function useGenerateChallenge(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.generateChallenge(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["challenges", slug] }),
  });
}

export function useJoinChallenge(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.joinChallenge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["challenges", slug] }),
  });
}

export function usePublishChallenge(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.publishChallenge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["challenges", slug] }),
  });
}
