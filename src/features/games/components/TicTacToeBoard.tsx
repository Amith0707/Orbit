import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, RadioIcon } from "@hugeicons/core-free-icons";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useTicTacToeMove } from "../hooks/useGames";
import type { Match, TicTacToeState } from "../api/games";
import { cn } from "@/lib/utils";

export function TicTacToeBoard({ match }: { match: Match<TicTacToeState> }) {
  const move = useTicTacToeMove(match.id);

  const handleClick = (cell: number) => {
    if (match.status !== "in_progress" || match.state.board[cell] !== null) return;
    move.mutate(cell, { onError: (err) => toast.error(getApiErrorMessage(err, "Invalid move")) });
  };

  return (
    <div className="mx-auto grid w-72 grid-cols-3 gap-2">
      {match.state.board.map((cell, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          disabled={match.status !== "in_progress" || cell !== null || move.isPending}
          className={cn(
            "flex aspect-square items-center justify-center rounded-2xl border border-border bg-muted/40 transition-colors hover:bg-muted disabled:cursor-default"
          )}
        >
          {cell === "X" && <HugeiconsIcon icon={Cancel01Icon} strokeWidth={3} className="size-10 text-ai-accent" />}
          {cell === "O" && <HugeiconsIcon icon={RadioIcon} strokeWidth={3} className="size-10 text-primary" />}
        </button>
      ))}
    </div>
  );
}
