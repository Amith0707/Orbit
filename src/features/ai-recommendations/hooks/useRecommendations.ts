import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommunityRecommendations, dismissCommunityRecommendation } from "../api/recommendations";

const KEY = ["ai", "recommendations", "communities"];

export function useCommunityRecommendations() {
  return useQuery({ queryKey: KEY, queryFn: () => getCommunityRecommendations(), staleTime: 5 * 60_000 });
}

export function useDismissCommunityRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissCommunityRecommendation,
    onMutate: async (communityId: string) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, (old: unknown) =>
        Array.isArray(old) ? old.filter((r) => r.communityId !== communityId) : old
      );
      return { previous };
    },
    onError: (_err, _communityId, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
  });
}
