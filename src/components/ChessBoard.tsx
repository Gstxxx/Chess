import { useState, useCallback } from "react";
import { Square } from "./Square";
import { ChessPiece } from "./ChessPiece";
import { initialBoard } from "../utils/chess";
import { calculatePieceMoves } from "../utils/chessMoves";
import { isKingInCheck, isMoveSafe, hasLegalMoves } from "../utils/gameChecks";
import type { Position } from "../types/chess";

export function ChessBoard() {
  // State declarations
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [capturedPieces, setCapturedPieces] = useState<{
    white: number;
    black: number;
  }>({ white: 0, black: 0 });
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [possibleCaptures, setPossibleCaptures] = useState<Position[]>([]);
  const [gameOver, setGameOver] = useState<"white" | "black" | "draw" | null>(
    null
  );
  const [checkingPiece, setCheckingPiece] = useState<Position | null>(null);
  const [kingInCheck, setKingInCheck] = useState<"white" | "black" | null>(
    null
  );

  const resetSelection = useCallback(() => {
    setSelectedPiece(null);
    setPossibleMoves([]);
    setPossibleCaptures([]);
  }, []);

  const handlePieceSelection = useCallback(
    (position: Position) => {
      const piece = board[position.y][position.x];
      if (piece && piece.color === turn) {
        setSelectedPiece(position);
        const { moves, captures } = calculatePieceMoves(position, piece, board);

        const safeMoves = moves.filter((move) =>
          isMoveSafe(board, position, move, piece)
        );
        const safeCaptures = captures.filter((capture) =>
          isMoveSafe(board, position, capture, piece)
        );

        setPossibleMoves(safeMoves);
        setPossibleCaptures(safeCaptures);
      }
    },
    [board, turn]
  );

  const handlePieceMove = useCallback(
    (from: Position, to: Position) => {
      const piece = board[from.y][from.x];
      const targetPiece = board[to.y][to.x];

      // Create new board state but don't update yet
      const newBoard = board.map((row) => [...row]);

      if (targetPiece) {
        // Animate capture
        const capturedPiece = { ...targetPiece, isCapturing: true };
        newBoard[to.y][to.x] = capturedPiece;

        // Update captured pieces count
        if (piece) {
          setCapturedPieces((prev) => ({
            ...prev,
            [piece.color]: prev[piece.color] + 1,
          }));

          if (targetPiece.type === "king") {
            setGameOver(piece.color);
            return;
          }
        }

        // Wait for capture animation before updating board
        setTimeout(() => {
          newBoard[to.y][to.x] = piece;
          newBoard[from.y][from.x] = null;
          setBoard(newBoard);
        }, 300);
      } else {
        // Regular move
        newBoard[to.y][to.x] = piece;
        newBoard[from.y][from.x] = null;
        setBoard(newBoard);
      }

      const nextTurn = turn === "white" ? "black" : "white";
      const checkingPiecePos = isKingInCheck(newBoard, nextTurn);

      setCheckingPiece(checkingPiecePos);
      setKingInCheck(checkingPiecePos ? nextTurn : null);

      if (checkingPiecePos && !hasLegalMoves(newBoard, nextTurn)) {
        setGameOver(turn);
        return;
      }

      if (!checkingPiecePos && !hasLegalMoves(newBoard, nextTurn)) {
        setGameOver("draw" as const);
        return;
      }

      setTurn(nextTurn);
    },
    [board, turn]
  );

  const handleSquareClick = useCallback(
    (position: Position) => {
      if (gameOver) return;

      if (!selectedPiece) {
        handlePieceSelection(position);
        return;
      }

      const isValidMove = possibleMoves.some(
        (move) => move.x === position.x && move.y === position.y
      );
      const isValidCapture = possibleCaptures.some(
        (capture) => capture.x === position.x && capture.y === position.y
      );

      if (isValidMove || isValidCapture) {
        handlePieceMove(selectedPiece, position);
      }

      resetSelection();
    },
    [
      selectedPiece,
      possibleMoves,
      possibleCaptures,
      gameOver,
      handlePieceSelection,
      handlePieceMove,
      resetSelection,
    ]
  );

  const renderBoard = useCallback(() => {
    return board.map((row, y) =>
      row.map((piece, x) => {
        const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
        const isPossibleMove = possibleMoves.some(
          (pos) => pos.x === x && pos.y === y
        );
        const isPossibleCapture = possibleCaptures.some(
          (pos) => pos.x === x && pos.y === y
        );
        const isCheckingPiece =
          checkingPiece?.x === x && checkingPiece?.y === y;

        return (
          <Square
            key={`${x}-${y}`}
            isLight={(x + y) % 2 === 0}
            isSelected={isSelected}
            isPossibleMove={isPossibleMove}
            isPossibleCapture={isPossibleCapture}
            isCheckingPiece={isCheckingPiece}
            onClick={() => handleSquareClick({ x, y })}
            onDrop={(fromPosition) => {
              handlePieceMove(fromPosition, { x, y });
              resetSelection();
            }}
          >
            {piece && (
              <ChessPiece
                type={piece.type}
                color={piece.color}
                position={{ x, y }}
                isCapturing={piece.isCapturing}
                onDragStart={() => handlePieceSelection({ x, y })}
                onDragEnd={(dropPosition) => {
                  if (!dropPosition) {
                    resetSelection();
                  }
                }}
              />
            )}
          </Square>
        );
      })
    );
  }, [
    board,
    selectedPiece,
    possibleMoves,
    possibleCaptures,
    checkingPiece,
    handleSquareClick,
    handlePieceMove,
    handlePieceSelection,
    resetSelection,
  ]);

  return (
    <div className="flex flex-col items-center gap-4">
      {gameOver && (
        <div className="text-3xl font-bold text-center text-green-600 mb-4">
          {gameOver === "draw"
            ? "Game Draw - Stalemate!"
            : `${
                gameOver.charAt(0).toUpperCase() + gameOver.slice(1)
              } wins by checkmate!`}
        </div>
      )}
      {kingInCheck && !gameOver && (
        <div className="text-2xl font-bold text-center text-red-600 mb-4">
          {kingInCheck.charAt(0).toUpperCase() + kingInCheck.slice(1)} King is
          in check!
        </div>
      )}
      <div className="flex justify-between w-full px-4 text-lg">
        <div>White captured: {capturedPieces.white}</div>
        <div>Black captured: {capturedPieces.black}</div>
      </div>
      <h2 className="text-2xl font-bold capitalize">
        {gameOver ? "Game Over" : `${turn}'s turn`}
      </h2>
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
        {renderBoard()}
      </div>
    </div>
  );
}
