import { useState, useCallback, useEffect } from "react";
import { Square } from "./Square";
import { ChessPiece } from "./ChessPiece";
import { initialBoard } from "../utils/chess";
import { calculatePieceMoves } from "../utils/chessMoves";
import { isMoveSafe } from "../utils/gameChecks";
import type { Position } from "../types/chess";
import { useGame } from "../hooks/useGame";
import { isCheckmate } from "../utils/chess";

export function ChessBoard() {
  // State declarations
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [possibleCaptures, setPossibleCaptures] = useState<Position[]>([]);
  const { isMyTurn, makeMove, playerColor, ws } = useGame();
  const [winner, setWinner] = useState<"white" | "black" | null>(null);

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
      if (!isMyTurn) return;

      const piece = board[from.y][from.x];
      if (piece?.color !== playerColor) return;

      const newBoard = board.map((row) => [...row]);

      // Update the board
      newBoard[to.y][to.x] = piece;
      newBoard[from.y][from.x] = null;
      setBoard(newBoard);

      // Send move to server
      makeMove(from, to, newBoard);

      // Reset selection
      resetSelection();
    },
    [board, isMyTurn, playerColor, makeMove]
  );

  const handleSquareClick = useCallback(
    (position: Position) => {
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

        return (
          <Square
            key={`${x}-${y}`}
            isLight={(x + y) % 2 === 0}
            isSelected={isSelected}
            isPossibleMove={isPossibleMove}
            isPossibleCapture={isPossibleCapture}
            isCheckingPiece={false}
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
    handleSquareClick,
    handlePieceMove,
    handlePieceSelection,
    resetSelection,
  ]);

  // Add WebSocket move handler
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "MOVE") {
        setBoard(data.gameState.board);
        setTurn(data.gameState.turn);

        // Check for checkmate after receiving move
        if (isCheckmate(data.gameState.board, data.gameState.turn)) {
          // The winner is the opposite of whose turn it is
          setWinner(data.gameState.turn === "white" ? "black" : "white");
        }

        resetSelection();
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws]);

  return (
    <div className="flex flex-col items-center gap-4">
      {winner ? (
        <h2 className="text-2xl font-bold text-green-600">
          {winner.charAt(0).toUpperCase() + winner.slice(1)} wins by checkmate!
        </h2>
      ) : (
        <h2 className="text-2xl font-bold capitalize">{`${turn}'s turn`}</h2>
      )}
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
        {renderBoard()}
      </div>
    </div>
  );
}
