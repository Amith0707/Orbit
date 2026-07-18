import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/games";
import type { GameKey, GameMode } from "../api/games";

export function useCreateMatch() {
  return useMutation({
    mutationFn: ({ gameKey, mode }: { gameKey: GameKey; mode: GameMode }) => api.createMatch(gameKey, mode),
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery({ queryKey: ["games", "match", matchId], queryFn: () => api.getMatch(matchId!), enabled: !!matchId });
}

export function useTicTacToeMove(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cell: number) => api.makeTicTacToeMove(matchId, cell),
    onSuccess: (match) => queryClient.setQueryData(["games", "match", matchId], match),
  });
}

export function useChessMove(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ from, to, promotion }: { from: string; to: string; promotion?: string }) =>
      api.makeChessMove(matchId, from, to, promotion),
    onSuccess: (match) => queryClient.setQueryData(["games", "match", matchId], match),
  });
}

export function useRpsMove(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choice: api.RpsChoice) => api.makeRpsMove(matchId, choice),
    onSuccess: (match) => queryClient.setQueryData(["games", "match", matchId], match),
  });
}

export function useConnectFourMove(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (column: number) => api.makeConnectFourMove(matchId, column),
    onSuccess: (match) => queryClient.setQueryData(["games", "match", matchId], match),
  });
}

export function useLeaderboard(gameKey: GameKey) {
  return useQuery({ queryKey: ["games", "leaderboard", gameKey], queryFn: () => api.getLeaderboard(gameKey) });
}
