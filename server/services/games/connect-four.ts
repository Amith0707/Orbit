export type Cell = "R" | "Y" | null;
export type Disc = "R" | "Y";

export interface ConnectFourState {
  board: Cell[];
  turn: Disc;
}

const ROWS = 6;
const COLS = 7;

function indexOf(row: number, col: number): number {
  return row * COLS + col;
}

export function initialState(): ConnectFourState {
  return { board: Array(ROWS * COLS).fill(null), turn: "R" };
}

function lowestEmptyRow(board: Cell[], col: number): number | null {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[indexOf(row, col)] === null) return row;
  }
  return null;
}

export function applyMove(state: ConnectFourState, column: number, player: Disc): ConnectFourState {
  if (column < 0 || column > COLS - 1) throw new Error("Column must be between 0 and 6");
  if (state.turn !== player) throw new Error("It's not your turn");
  const row = lowestEmptyRow(state.board, column);
  if (row === null) throw new Error("That column is full");

  const board = [...state.board];
  board[indexOf(row, column)] = player;
  return { board, turn: player === "R" ? "Y" : "R" };
}

function lineValue(board: Cell[], cells: [number, number][]): Cell {
  const first = board[indexOf(cells[0][0], cells[0][1])];
  if (!first) return null;
  return cells.every(([r, c]) => board[indexOf(r, c)] === first) ? first : null;
}

export function checkWinner(board: Cell[]): Disc | "draw" | null {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (col <= COLS - 4) {
        const winner = lineValue(board, [[row, col], [row, col + 1], [row, col + 2], [row, col + 3]]);
        if (winner) return winner;
      }
      if (row <= ROWS - 4) {
        const winner = lineValue(board, [[row, col], [row + 1, col], [row + 2, col], [row + 3, col]]);
        if (winner) return winner;
      }
      if (row <= ROWS - 4 && col <= COLS - 4) {
        const winner = lineValue(board, [[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]]);
        if (winner) return winner;
      }
      if (row <= ROWS - 4 && col >= 3) {
        const winner = lineValue(board, [[row, col], [row + 1, col - 1], [row + 2, col - 2], [row + 3, col - 3]]);
        if (winner) return winner;
      }
    }
  }
  return board.every((c) => c !== null) ? "draw" : null;
}

const CENTER_FIRST_COLUMNS = [3, 2, 4, 1, 5, 0, 6];

export function pickAiMove(state: ConnectFourState): number {
  const { board, turn } = state;
  const opponent: Disc = turn === "R" ? "Y" : "R";
  const candidates = CENTER_FIRST_COLUMNS.filter((col) => lowestEmptyRow(board, col) !== null);

  for (const col of candidates) {
    const row = lowestEmptyRow(board, col)!;
    const next = [...board];
    next[indexOf(row, col)] = turn;
    if (checkWinner(next) === turn) return col;
  }

  for (const col of candidates) {
    const row = lowestEmptyRow(board, col)!;
    const next = [...board];
    next[indexOf(row, col)] = opponent;
    if (checkWinner(next) === opponent) return col;
  }

  return candidates[0];
}
