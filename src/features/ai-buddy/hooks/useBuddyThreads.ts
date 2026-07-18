import { useQuery } from "@tanstack/react-query";
import { listThreads } from "../api/buddy";

export function useBuddyThreads() {
  return useQuery({ queryKey: ["ai", "buddy", "threads"], queryFn: listThreads });
}
