import type { Position, ChessPiece } from "../types/chess";
import { calculatePieceMoves } from "./chessMoves";

// Add Board type if not already defined elsewhere
type Board = (ChessPiece | null)[][];

export const findKing = (
  color: "white" | "black",
  board: Board
): Position | null => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece?.type === "king" && piece.color === color) {
        return { x, y };
      }
    }
  }
  return null;
};

export const isKingInCheck = (
  board: Board,
  color: "white" | "black"
): Position | null => {
  const kingPosition = findKing(color, board);
  if (!kingPosition) return null;

  // Check all opponent pieces for possible attacks on the king
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && piece.color !== color) {
        const { captures } = calculatePieceMoves({ x, y }, piece, board);
        if (
          captures.some(
            (pos) => pos.x === kingPosition.x && pos.y === kingPosition.y
          )
        ) {
          return { x, y }; // Return the position of the checking piece
        }
      }
    }
  }
  return null;
};

export const isMoveSafe = (
  board: Board,
  from: Position,
  to: Position,
  movingPiece: ChessPiece
): boolean => {
  // Create a temporary board with the proposed move
  const tempBoard = board.map((row) => [...row]);
  tempBoard[to.y][to.x] = movingPiece;
  tempBoard[from.y][from.x] = null;

  // Find the king's position after the move
  const kingPos =
    movingPiece.type === "king" ? to : findKing(movingPiece.color, tempBoard);
  if (!kingPos) return false;

  // Check if any opponent piece can capture the king in this position
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = tempBoard[y][x];
      if (piece && piece.color !== movingPiece.color) {
        const { captures } = calculatePieceMoves({ x, y }, piece, tempBoard);
        if (
          captures.some((pos) => pos.x === kingPos.x && pos.y === kingPos.y)
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

export const hasLegalMoves = (
  board: Board,
  color: "white" | "black"
): boolean => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && piece.color === color) {
        const { moves, captures } = calculatePieceMoves({ x, y }, piece, board);

        // Check if any of the possible moves are legal
        for (const move of [...moves, ...captures]) {
          if (isMoveSafe(board, { x, y }, move, piece)) {
            return true;
          }
        }
      }
    }
  }
  return false;
};
