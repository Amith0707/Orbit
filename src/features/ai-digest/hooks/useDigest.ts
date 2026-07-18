import { useQuery } from "@tanstack/react-query";
import { getDigest, getDigestHistory } from "../api/digest";

export function useWeeklyDigest() {
  return useQuery({ queryKey: ["ai", "digest"], queryFn: () => getDigest(), staleTime: 60 * 60_000 });
}

export function useDigestHistory() {
  return useQuery({ queryKey: ["ai", "digest", "history"], queryFn: getDigestHistory });
}
