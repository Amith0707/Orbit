import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/admin";
import type { Role } from "@/features/auth/types";

export function useAdminUsers(params: { search?: string; role?: Role; isActive?: boolean; limit?: number; offset?: number }) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: () => api.listUsers(params) });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => api.setUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => api.setUserActive(userId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminCommunities(params: { limit?: number; offset?: number } = {}) {
  return useQuery({ queryKey: ["admin", "communities", params], queryFn: () => api.listCommunities(params) });
}

export function useSetCommunityArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, isArchived }: { communityId: string; isArchived: boolean }) =>
      api.setCommunityArchived(communityId, isArchived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "communities"] }),
  });
}

export function useAdminModerationPosts(params: { limit?: number; offset?: number } = {}) {
  return useQuery({ queryKey: ["admin", "moderation", "posts", params], queryFn: () => api.listModerationPosts(params) });
}

export function useDeleteModerationPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteModerationPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "posts"] }),
  });
}
