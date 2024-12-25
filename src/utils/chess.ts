import type { ChessPiece } from "../types/chess";
import { calculatePieceMoves } from "./chessMoves";
import { isKingInCheck, isMoveSafe } from "./gameChecks";

export const initialBoard: (ChessPiece | null)[][] = [
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "black" })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8)
    .fill(null)
    .map(() => ({ type: "pawn", color: "white" })),
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
];

export function isCheckmate(
  board: (ChessPiece | null)[][],
  currentTurn: "white" | "black"
): boolean {
  const checkingPiece = isKingInCheck(board, currentTurn);
  if (!checkingPiece) {
    return false;
  }

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && piece.color === currentTurn) {
        const { moves, captures } = calculatePieceMoves({ x, y }, piece, board);
        const allMoves = [...moves, ...captures];

        for (const move of allMoves) {
          if (isMoveSafe(board, { x, y }, move, piece)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}
