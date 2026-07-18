import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/posts";
import type { Post, ReactionType } from "../api/posts";

export function usePosts(slug: string) {
  return useQuery({ queryKey: ["posts", slug], queryFn: () => api.listPosts(slug), enabled: !!slug });
}

export function usePost(postId: string) {
  return useQuery({ queryKey: ["post", postId], queryFn: () => api.getPost(postId), enabled: !!postId });
}

export function useCreatePost(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; imageUrl?: string }) => api.createPost(slug, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", slug] }),
  });
}

function updatePostInCaches(queryClient: ReturnType<typeof useQueryClient>, updated: Post) {
  queryClient.setQueryData(["post", updated.id], updated);
  queryClient.setQueriesData<{ posts: Post[]; total: number } | undefined>(
    { queryKey: ["posts"] },
    (old) => (old ? { ...old, posts: old.posts.map((p) => (p.id === updated.id ? updated : p)) } : old)
  );
}

export function useReactToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) =>
      api.reactToPost(postId, reactionType),
    onSuccess: (updated) => updatePostInCaches(queryClient, updated),
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.removeReaction(postId),
    onSuccess: (updated) => updatePostInCaches(queryClient, updated),
  });
}

export function usePinPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, pinned }: { postId: string; pinned: boolean }) =>
      pinned ? api.pinPost(postId) : api.unpinPost(postId),
    onSuccess: (updated) => updatePostInCaches(queryClient, updated),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useComments(postId: string) {
  return useQuery({ queryKey: ["comments", postId], queryFn: () => api.listComments(postId), enabled: !!postId });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.createComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
