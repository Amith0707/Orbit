export type Cell = "X" | "O" | null;

export interface TicTacToeState {
  board: Cell[];
  turn: "X" | "O";
}

export function initialState(): TicTacToeState {
  return { board: Array(9).fill(null), turn: "X" };
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board: Cell[]): "X" | "O" | "draw" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

export function applyMove(state: TicTacToeState, cell: number, player: "X" | "O"): TicTacToeState {
  if (cell < 0 || cell > 8) throw new Error("Cell must be between 0 and 8");
  if (state.board[cell] !== null) throw new Error("That cell is already taken");
  if (state.turn !== player) throw new Error("It's not your turn");

  const board = [...state.board];
  board[cell] = player;
  return { board, turn: player === "X" ? "O" : "X" };
}

function minimax(board: Cell[], player: "X" | "O", aiPlayer: "X" | "O", depth: number): { score: number; move?: number } {
  const winner = checkWinner(board);
  if (winner === aiPlayer) return { score: 10 - depth };
  if (winner === "draw") return { score: 0 };
  if (winner) return { score: depth - 10 };

  let best: { score: number; move?: number } | undefined;
  for (let i = 0; i < 9; i += 1) {
    if (board[i] !== null) continue;
    const next = [...board];
    next[i] = player;
    const result = minimax(next, player === "X" ? "O" : "X", aiPlayer, depth + 1);
    const candidate = { score: result.score, move: i };
    if (!best) {
      best = candidate;
    } else if (player === aiPlayer ? candidate.score > best.score : candidate.score < best.score) {
      best = candidate;
    }
  }
  return best!;
}

export function pickAiMove(state: TicTacToeState): number {
  const result = minimax(state.board, state.turn, state.turn, 0);
  return result.move!;
}
