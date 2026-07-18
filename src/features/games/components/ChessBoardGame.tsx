import { Chessboard } from "react-chessboard";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useChessMove } from "../hooks/useGames";
import type { ChessState, Match } from "../api/games";

export function ChessBoardGame({ match }: { match: Match<ChessState> }) {
  const move = useChessMove(match.id);

  const handleDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare || match.status !== "in_progress") return false;

    move.mutate(
      { from: sourceSquare, to: targetSquare, promotion: "q" },
      {
        onError: (err) => toast.error(getApiErrorMessage(err, "Illegal move")),
      }
    );
    return true;
  };

  return (
    <div className="mx-auto max-w-md">
      <Chessboard
        options={{
          position: match.state.fen,
          onPieceDrop: handleDrop,
          boardOrientation: "white",
          allowDragging: match.status === "in_progress",
        }}
      />
    </div>
  );
}
