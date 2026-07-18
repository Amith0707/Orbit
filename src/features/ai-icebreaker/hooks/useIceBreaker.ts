import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIceBreaker } from "../api/iceBreaker";

export function useIceBreaker(userId: string) {
  return useQuery({
    queryKey: ["ai", "icebreaker", userId],
    queryFn: () => getIceBreaker(userId),
    enabled: !!userId,
    staleTime: 30 * 60_000,
  });
}

export function useRegenerateIceBreaker(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getIceBreaker(userId, true),
    onSuccess: (result) => queryClient.setQueryData(["ai", "icebreaker", userId], result),
  });
}
