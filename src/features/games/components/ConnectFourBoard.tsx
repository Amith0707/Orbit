import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useConnectFourMove } from "../hooks/useGames";
import type { Match, ConnectFourState } from "../api/games";
import { cn } from "@/lib/utils";

const ROWS = 6;
const COLS = 7;

export function ConnectFourBoard({ match }: { match: Match<ConnectFourState> }) {
  const move = useConnectFourMove(match.id);
  const board = match.state.board;

  const handleDrop = (col: number) => {
    if (match.status !== "in_progress" || move.isPending || board[col] !== null) return;
    move.mutate(col, { onError: (err) => toast.error(getApiErrorMessage(err, "Invalid move")) });
  };

  return (
    <div className="mx-auto w-fit rounded-2xl bg-primary/10 p-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={`drop-${col}`}
            type="button"
            onClick={() => handleDrop(col)}
            disabled={match.status !== "in_progress" || move.isPending || board[col] !== null}
            className="flex items-center justify-center rounded-md py-1 text-muted-foreground transition-colors hover:bg-primary/15 disabled:cursor-default disabled:opacity-30"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
          </button>
        ))}
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const cell = board[row * COLS + col];
            return (
              <div key={`${row}-${col}`} className="flex size-9 items-center justify-center rounded-full bg-background sm:size-10">
                <div
                  className={cn(
                    "size-7 rounded-full sm:size-8",
                    cell === "R" && "bg-red-500",
                    cell === "Y" && "bg-yellow-400",
                    !cell && "bg-muted"
                  )}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
