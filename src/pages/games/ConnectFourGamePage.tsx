import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Grid2X2Icon, RobotIcon, UserMultiple02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useCreateMatch, useMatch } from "@/features/games/hooks/useGames";
import { ConnectFourBoard } from "@/features/games/components/ConnectFourBoard";
import type { Match, ConnectFourState } from "@/features/games/api/games";

export default function ConnectFourGamePage() {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const createMatch = useCreateMatch();
  const { data: match, isPending } = useMatch(matchId);

  const startMatch = async (mode: "pvp" | "pvai") => {
    try {
      const created = await createMatch.mutateAsync({ gameKey: "connect_four", mode });
      setMatchId(created.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't start a new match"));
    }
  };

  const resultLabel = (result: string | null) => {
    if (result === "draw") return "It's a draw";
    if (result === "player_one_win") return match?.mode === "pvai" ? "You won! 🎉" : "Red wins!";
    if (result === "player_two_win") return match?.mode === "pvai" ? "The AI won this time." : "Yellow wins!";
    return null;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Connect Four</h1>
          <p className="text-sm text-muted-foreground">Drop discs and get four in a row before your opponent does.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/games/leaderboard")}>
          View leaderboard
        </Button>
      </div>

      {!matchId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Grid2X2Icon} strokeWidth={1.5} className="size-7" />
            </div>
            <p className="text-sm text-muted-foreground">Choose how you'd like to play.</p>
            <div className="flex gap-3">
              <Button disabled={createMatch.isPending} onClick={() => startMatch("pvai")}>
                <HugeiconsIcon icon={RobotIcon} strokeWidth={2} /> Play vs AI
              </Button>
              <Button variant="outline" disabled={createMatch.isPending} onClick={() => startMatch("pvp")}>
                <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} /> Local 2 player
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isPending || !match ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading match…</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1.5">
              <HugeiconsIcon icon={match.mode === "pvai" ? RobotIcon : UserMultiple02Icon} strokeWidth={2} className="size-3.5" />
              {match.mode === "pvai" ? "Vs AI" : "Local 2 player"}
            </Badge>
            {match.status === "completed" && (
              <Button size="sm" variant="outline" onClick={() => setMatchId(undefined)}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} /> New match
              </Button>
            )}
          </div>
          <ConnectFourBoard match={match as unknown as Match<ConnectFourState>} />
          {match.status === "completed" && (
            <p className="text-center font-heading text-sm font-medium">{resultLabel(match.result)}</p>
          )}
        </div>
      )}
    </div>
  );
}
