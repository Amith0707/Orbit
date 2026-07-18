export type Choice = "rock" | "paper" | "scissors";
export type Player = "player_one" | "player_two";

export interface RpsRound {
  playerOneChoice: Choice;
  playerTwoChoice: Choice;
  winner: Player | "tie";
}

export interface RpsState {
  turn: Player;
  pendingChoice: Choice | null;
  rounds: RpsRound[];
  playerOneScore: number;
  playerTwoScore: number;
}

const TOTAL_ROUNDS = 3;
const BEATS: Record<Choice, Choice> = { rock: "scissors", paper: "rock", scissors: "paper" };

export function initialState(): RpsState {
  return { turn: "player_one", pendingChoice: null, rounds: [], playerOneScore: 0, playerTwoScore: 0 };
}

export function pickAiChoice(): Choice {
  const choices: Choice[] = ["rock", "paper", "scissors"];
  return choices[Math.floor(Math.random() * choices.length)];
}

function resolveRound(playerOneChoice: Choice, playerTwoChoice: Choice): Player | "tie" {
  if (playerOneChoice === playerTwoChoice) return "tie";
  return BEATS[playerOneChoice] === playerTwoChoice ? "player_one" : "player_two";
}

export function applyChoice(state: RpsState, player: Player, choice: Choice): RpsState {
  if (state.rounds.length >= TOTAL_ROUNDS) throw new Error("The match is already over");
  if (state.turn !== player) throw new Error("It's not your turn");

  if (state.turn === "player_one") {
    return { ...state, turn: "player_two", pendingChoice: choice };
  }

  const playerOneChoice = state.pendingChoice;
  if (!playerOneChoice) throw new Error("Waiting on the first player's choice");
  const winner = resolveRound(playerOneChoice, choice);
  const round: RpsRound = { playerOneChoice, playerTwoChoice: choice, winner };
  return {
    turn: "player_one",
    pendingChoice: null,
    rounds: [...state.rounds, round],
    playerOneScore: state.playerOneScore + (winner === "player_one" ? 1 : 0),
    playerTwoScore: state.playerTwoScore + (winner === "player_two" ? 1 : 0),
  };
}

export function checkMatchWinner(state: RpsState): Player | "draw" | null {
  if (state.rounds.length < TOTAL_ROUNDS) return null;
  if (state.playerOneScore > state.playerTwoScore) return "player_one";
  if (state.playerTwoScore > state.playerOneScore) return "player_two";
  return "draw";
}
