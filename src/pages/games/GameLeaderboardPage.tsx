import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award02Icon, Chess01Icon, PuzzleIcon, HandFistIcon, Grid2X2Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GradientAvatar } from "@/components/composite/GradientAvatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/composite/EmptyState";
import { useLeaderboard } from "@/features/games/hooks/useGames";
import type { GameKey, LeaderboardEntry } from "@/features/games/api/games";

function LeaderboardList({ gameKey }: { gameKey: GameKey }) {
  const { data, isPending } = useLeaderboard(gameKey);

  if (isPending) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<HugeiconsIcon icon={Award02Icon} strokeWidth={2} className="size-5" />}
        title="No matches played yet"
        description="Play a game to be the first on the board."
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry: LeaderboardEntry, i: number) => (
        <div key={entry.userId} className="flex items-center gap-3 rounded-xl border border-border p-3">
          <span className="w-5 text-center text-sm font-medium text-muted-foreground">{i + 1}</span>
          <GradientAvatar
            seed={entry.userId}
            src={entry.avatarUrl}
            initials={`${entry.firstName[0]}${entry.lastName[0]}`}
            alt={entry.firstName}
          />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {entry.firstName} {entry.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{entry.gamesPlayed} games played</p>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="secondary">{entry.wins}W</Badge>
            <Badge variant="outline">{entry.draws}D</Badge>
            <Badge variant="outline">{entry.losses}L</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GameLeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top players across Calfus Orbit's mini games.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/games")}>
          Back to games
        </Button>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="chess">
            <TabsList>
              <TabsTrigger value="chess">
                <HugeiconsIcon icon={Chess01Icon} strokeWidth={2} className="size-3.5" /> Chess
              </TabsTrigger>
              <TabsTrigger value="tic_tac_toe">
                <HugeiconsIcon icon={PuzzleIcon} strokeWidth={2} className="size-3.5" /> Tic Tac Toe
              </TabsTrigger>
              <TabsTrigger value="rock_paper_scissors">
                <HugeiconsIcon icon={HandFistIcon} strokeWidth={2} className="size-3.5" /> Rock Paper Scissors
              </TabsTrigger>
              <TabsTrigger value="connect_four">
                <HugeiconsIcon icon={Grid2X2Icon} strokeWidth={2} className="size-3.5" /> Connect Four
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chess">
              <LeaderboardList gameKey="chess" />
            </TabsContent>
            <TabsContent value="tic_tac_toe">
              <LeaderboardList gameKey="tic_tac_toe" />
            </TabsContent>
            <TabsContent value="rock_paper_scissors">
              <LeaderboardList gameKey="rock_paper_scissors" />
            </TabsContent>
            <TabsContent value="connect_four">
              <LeaderboardList gameKey="connect_four" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
