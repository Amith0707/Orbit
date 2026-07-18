import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { Button } from "@/components/ui/button";
import { useRpsMove } from "../hooks/useGames";
import type { Match, RpsState, RpsChoice } from "../api/games";
import { cn } from "@/lib/utils";

const CHOICES: { value: RpsChoice; label: string }[] = [
  { value: "rock", label: "Rock" },
  { value: "paper", label: "Paper" },
  { value: "scissors", label: "Scissors" },
];

function choiceLabel(choice: RpsChoice) {
  return CHOICES.find((c) => c.value === choice)?.label ?? choice;
}

export function RockPaperScissorsBoard({ match }: { match: Match<RpsState> }) {
  const move = useRpsMove(match.id);
  const state = match.state;
  const isOver = match.status === "completed";
  const opponentLabel = match.mode === "pvai" ? "AI" : "P2";

  const handlePick = (choice: RpsChoice) => {
    if (isOver || move.isPending) return;
    move.mutate(choice, { onError: (err) => toast.error(getApiErrorMessage(err, "Invalid move")) });
  };

  const turnLabel = state.turn === "player_one" ? "P1" : opponentLabel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6 text-sm font-medium">
        <span>P1: {state.playerOneScore}</span>
        <span className="text-xs text-muted-foreground">Best of 3</span>
        <span>
          {opponentLabel}: {state.playerTwoScore}
        </span>
      </div>

      {!isOver && <p className="text-center text-xs text-muted-foreground">{turnLabel}'s turn to choose</p>}

      <div className="mx-auto flex max-w-xs justify-center gap-3">
        {CHOICES.map((choice) => (
          <Button
            key={choice.value}
            type="button"
            variant="outline"
            disabled={isOver || move.isPending}
            onClick={() => handlePick(choice.value)}
            className="flex-1"
          >
            {choice.label}
          </Button>
        ))}
      </div>

      {state.rounds.length > 0 && (
        <div className="space-y-1.5">
          {state.rounds.map((round, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs"
            >
              <span>
                Round {i + 1}: {choiceLabel(round.playerOneChoice)} vs {choiceLabel(round.playerTwoChoice)}
              </span>
              <span className={cn("font-medium", round.winner === "tie" ? "text-muted-foreground" : "text-ai-accent")}>
                {round.winner === "tie" ? "Tie" : round.winner === "player_one" ? "P1" : opponentLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
