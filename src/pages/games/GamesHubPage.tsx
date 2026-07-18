import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Chess01Icon, PuzzleIcon, Award02Icon, HandFistIcon, Grid2X2Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const GAMES = [
  { key: "chess", name: "Chess", icon: Chess01Icon, description: "Classic strategy. Play a coworker locally or challenge the AI." },
  { key: "tic-tac-toe", name: "Tic Tac Toe", icon: PuzzleIcon, description: "Quick and simple. Best of luck against our AI." },
  { key: "rock-paper-scissors", name: "Rock Paper Scissors", icon: HandFistIcon, description: "Best of 3 rounds. Fast and easy to pick up." },
  { key: "connect-four", name: "Connect Four", icon: Grid2X2Icon, description: "Drop discs and get four in a row before your opponent." },
];

export default function GamesHubPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Games</h1>
          <p className="text-sm text-muted-foreground">Take a break and challenge a coworker or the AI.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/games/leaderboard")}>
          <HugeiconsIcon icon={Award02Icon} strokeWidth={2} /> Leaderboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <Card key={game.key} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/games/${game.key}`)}>
            <CardContent className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                <HugeiconsIcon icon={game.icon} strokeWidth={1.5} className="size-5" />
              </div>
              <div>
                <p className="font-heading text-sm font-medium">{game.name}</p>
                <p className="text-xs text-muted-foreground">{game.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
