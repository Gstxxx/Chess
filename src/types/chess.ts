export interface Position {
  x: number;
  y: number;
}

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";

export interface ChessPiece {
  type: PieceType;
  color: "white" | "black";
  isCapturing?: boolean;
}
