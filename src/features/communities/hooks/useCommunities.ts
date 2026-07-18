import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/communities";

export function useCommunities(params: { search?: string; joinedOnly?: boolean; limit?: number; offset?: number } = {}) {
  return useQuery({ queryKey: ["communities", "list", params], queryFn: () => api.listCommunities(params) });
}

export function useMyCommunities() {
  return useQuery({ queryKey: ["communities", "mine"], queryFn: api.listMyCommunities });
}

export function useCommunity(slug: string) {
  return useQuery({ queryKey: ["communities", slug], queryFn: () => api.getCommunity(slug), enabled: !!slug });
}

export function useCommunityMembers(slug: string) {
  return useQuery({ queryKey: ["communities", slug, "members"], queryFn: () => api.listCommunityMembers(slug), enabled: !!slug });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.joinCommunity,
    onSuccess: (community) => {
      queryClient.setQueryData(["communities", community.slug], community);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "recommendations", "communities"] });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.leaveCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}
