import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evaluateMaterial(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const square of row) {
      if (!square) continue;
      const value = PIECE_VALUES[square.type];
      score += square.color === "w" ? value : -value;
    }
  }
  return score;
}

// Negamax with the side-to-move's perspective always positive.
function negamax(chess: Chess, depth: number): number {
  if (chess.isCheckmate()) return -100000;
  if (chess.isDraw() || chess.isStalemate()) return 0;
  if (depth === 0) {
    const perspective = chess.turn() === "w" ? 1 : -1;
    return perspective * evaluateMaterial(chess);
  }

  let best = -Infinity;
  for (const move of chess.moves({ verbose: true })) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = -negamax(chess, depth - 1);
    chess.undo();
    if (score > best) best = score;
  }
  return best;
}

export interface ChessAiMove {
  from: string;
  to: string;
  promotion?: string;
}

export function pickAiMove(fen: string, depth = 2): ChessAiMove {
  const chess = new Chess(fen);
  const candidates = chess.moves({ verbose: true });
  if (candidates.length === 0) throw new Error("No legal moves available");

  const scored = candidates.map((move) => {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = -negamax(chess, depth);
    chess.undo();
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const nearBest = scored.filter((s) => s.score >= topScore - 30);
  const chosen = nearBest[Math.floor(Math.random() * nearBest.length)];

  return { from: chosen.move.from, to: chosen.move.to, promotion: chosen.move.promotion };
}
