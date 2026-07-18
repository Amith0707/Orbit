import { useQuery } from "@tanstack/react-query";
import { listTags, listDepartments, type TagKind } from "../api/meta";

export function useTags(kind?: TagKind) {
  return useQuery({ queryKey: ["meta", "tags", kind], queryFn: () => listTags(kind), staleTime: 10 * 60_000 });
}

export function useDepartments() {
  return useQuery({ queryKey: ["meta", "departments"], queryFn: listDepartments, staleTime: 10 * 60_000 });
}
