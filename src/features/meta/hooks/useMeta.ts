import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTags, createTag, listDepartments, type TagKind } from "../api/meta";

export function useTags(kind?: TagKind) {
  return useQuery({ queryKey: ["meta", "tags", kind], queryFn: () => listTags(kind), staleTime: 10 * 60_000 });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, name }: { kind: TagKind; name: string }) => createTag(kind, name),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ["meta", "tags", tag.kind] });
      queryClient.invalidateQueries({ queryKey: ["meta", "tags", undefined] });
    },
  });
}

export function useDepartments() {
  return useQuery({ queryKey: ["meta", "departments"], queryFn: listDepartments, staleTime: 10 * 60_000 });
}
