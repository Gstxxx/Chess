import type { Position, ChessPiece } from "../types/chess";

export const calculatePawnMoves = (
  position: Position,
  color: "white" | "black",
  board: (ChessPiece | null)[][]
) => {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const direction = color === "white" ? -1 : 1;
  const isFirstMove =
    (color === "white" && position.y === 6) ||
    (color === "black" && position.y === 1);

  // Forward moves
  const oneSquareAhead = { x: position.x, y: position.y + direction };
  if (
    oneSquareAhead.y >= 0 &&
    oneSquareAhead.y < 8 &&
    !board[oneSquareAhead.y][oneSquareAhead.x]
  ) {
    moves.push(oneSquareAhead);

    // Two squares on first move
    if (isFirstMove) {
      const twoSquaresAhead = {
        x: position.x,
        y: position.y + direction * 2,
      };
      if (!board[twoSquaresAhead.y][twoSquaresAhead.x]) {
        moves.push(twoSquaresAhead);
      }
    }
  }

  // Capture moves
  const captureSquares = [
    { x: position.x - 1, y: position.y + direction },
    { x: position.x + 1, y: position.y + direction },
  ];

  captureSquares.forEach((pos) => {
    if (pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8) {
      const targetPiece = board[pos.y][pos.x];
      if (targetPiece && targetPiece.color !== color) {
        captures.push(pos);
      }
    }
  });

  return { moves, captures };
};

export const calculateStraightMoves = (
  position: Position,
  color: "white" | "black",
  board: (ChessPiece | null)[][],
  maxDistance?: number
) => {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const directions = [
    { x: 0, y: 1 }, // down
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: -1, y: 0 }, // left
  ];

  directions.forEach((dir) => {
    let distance = 1;
    while (distance <= (maxDistance || 7)) {
      const newX = position.x + dir.x * distance;
      const newY = position.y + dir.y * distance;

      if (newX < 0 || newX > 7 || newY < 0 || newY > 7) break;

      const targetPiece = board[newY][newX];
      if (targetPiece) {
        if (targetPiece.color !== color) {
          captures.push({ x: newX, y: newY });
        }
        break;
      }

      moves.push({ x: newX, y: newY });
      distance++;
    }
  });

  return { moves, captures };
};

export const calculateDiagonalMoves = (
  position: Position,
  color: "white" | "black",
  board: (ChessPiece | null)[][],
  maxDistance?: number
) => {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const directions = [
    { x: 1, y: 1 }, // down-right
    { x: 1, y: -1 }, // up-right
    { x: -1, y: 1 }, // down-left
    { x: -1, y: -1 }, // up-left
  ];

  directions.forEach((dir) => {
    let distance = 1;
    while (distance <= (maxDistance || 7)) {
      const newX = position.x + dir.x * distance;
      const newY = position.y + dir.y * distance;

      if (newX < 0 || newX > 7 || newY < 0 || newY > 7) break;

      const targetPiece = board[newY][newX];
      if (targetPiece) {
        if (targetPiece.color !== color) {
          captures.push({ x: newX, y: newY });
        }
        break;
      }

      moves.push({ x: newX, y: newY });
      distance++;
    }
  });

  return { moves, captures };
};

export const calculateKnightMoves = (
  position: Position,
  color: "white" | "black",
  board: (ChessPiece | null)[][]
) => {
  const moves: Position[] = [];
  const captures: Position[] = [];
  const knightMoves = [
    { x: 2, y: 1 },
    { x: 2, y: -1 },
    { x: -2, y: 1 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
    { x: 1, y: -2 },
    { x: -1, y: 2 },
    { x: -1, y: -2 },
  ];

  knightMoves.forEach((move) => {
    const newX = position.x + move.x;
    const newY = position.y + move.y;

    if (newX >= 0 && newX <= 7 && newY >= 0 && newY <= 7) {
      const targetPiece = board[newY][newX];
      if (!targetPiece) {
        moves.push({ x: newX, y: newY });
      } else if (targetPiece.color !== color) {
        captures.push({ x: newX, y: newY });
      }
    }
  });

  return { moves, captures };
};

export const calculatePieceMoves = (
  position: Position,
  piece: ChessPiece,
  board: (ChessPiece | null)[][]
) => {
  switch (piece.type) {
    case "rook":
      return calculateStraightMoves(position, piece.color, board);
    case "bishop":
      return calculateDiagonalMoves(position, piece.color, board);
    case "knight":
      return calculateKnightMoves(position, piece.color, board);
    case "queen": {
      const straight = calculateStraightMoves(position, piece.color, board);
      const diagonal = calculateDiagonalMoves(position, piece.color, board);
      return {
        moves: [...straight.moves, ...diagonal.moves],
        captures: [...straight.captures, ...diagonal.captures],
      };
    }
    case "king": {
      const straightKing = calculateStraightMoves(
        position,
        piece.color,
        board,
        1
      );
      const diagonalKing = calculateDiagonalMoves(
        position,
        piece.color,
        board,
        1
      );
      return {
        moves: [...straightKing.moves, ...diagonalKing.moves],
        captures: [...straightKing.captures, ...diagonalKing.captures],
      };
    }
    case "pawn":
      return calculatePawnMoves(position, piece.color, board);
    default:
      return { moves: [], captures: [] };
  }
};
