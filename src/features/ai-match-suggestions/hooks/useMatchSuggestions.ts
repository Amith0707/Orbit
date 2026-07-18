import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMatchSuggestions, dismissMatchSuggestion } from "../api/matches";

const KEY = ["ai", "recommendations", "matches"];

export function useMatchSuggestions() {
  return useQuery({ queryKey: KEY, queryFn: () => getMatchSuggestions(), staleTime: 5 * 60_000 });
}

export function useDismissMatchSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissMatchSuggestion,
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old: unknown) => (Array.isArray(old) ? old.filter((r) => r.userId !== userId) : old));
      return { previous };
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
  });
}
