import React, { createContext, useState, useCallback } from "react";
import type { ChessPiece, Position } from "../types/chess";
import { isCheckmate } from "../utils/chess";

interface Room {
  id: string;
  name: string;
  playerColor?: "white" | "black";
}

interface GameContextType {
  connect: () => void;
  createRoom: (
    name: string,
    preferredColor: "white" | "black"
  ) => Promise<void>;
  requestJoin: (roomId: string) => Promise<void>;
  currentRoom: Room | null;
  ws: WebSocket | null;
  isMyTurn: boolean;
  makeMove: (
    from: Position,
    to: Position,
    newBoard: (ChessPiece | null)[][]
  ) => void;
  playerColor: "white" | "black" | null;
  setBoard: (board: (ChessPiece | null)[][]) => void;
  gameStatus: "active" | "checkmate" | "stalemate" | null;
}

export const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(
    null
  );
  const [turn, setTurn] = useState<"white" | "black">("white");
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(
    Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))
  );
  const [gameStatus, setGameStatus] = useState<
    "active" | "checkmate" | "stalemate" | null
  >(null);

  const isMyTurn = playerColor === turn;

  const connect = useCallback(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("Connected to server");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      switch (data.type) {
        case "ROOM_CREATED":
          setCurrentRoom({
            id: data.roomId,
            name: data.name,
            playerColor: data.color,
          });
          setPlayerColor(data.color);
          break;

        case "JOINED_ROOM":
          setCurrentRoom({
            id: data.roomId,
            name: data.name,
            playerColor: data.color,
          });
          setPlayerColor(data.color);
          break;

        case "MOVE":
          if (data.gameState) {
            setBoard(data.gameState.board);
            setTurn(data.gameState.turn);

            if (data.gameState.status) {
              setGameStatus(data.gameState.status);
            }
          }
          break;

        case "OPPONENT_LEFT":
          // Handle opponent leaving
          break;

        case "ERROR":
          console.error("Server error:", data.message);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Disconnected from server");
      setWs(null);
    };

    setWs(socket);
  }, []);

  const makeMove = useCallback(
    (from: Position, to: Position, newBoard: (ChessPiece | null)[][]) => {
      if (!ws || !currentRoom) return;

      const nextTurn = turn === "white" ? "black" : "white";
      const status = isCheckmate(newBoard, nextTurn) ? "checkmate" : "active";

      ws.send(
        JSON.stringify({
          type: "MOVE",
          roomId: currentRoom.id,
          move: { from, to },
          gameState: {
            board: newBoard,
            turn: nextTurn,
            status,
          },
        })
      );
    },
    [ws, currentRoom, turn]
  );

  const createRoom = useCallback(
    async (name: string, preferredColor: "white" | "black") => {
      if (!ws) return;

      return new Promise<void>((resolve, reject) => {
        try {
          ws.send(
            JSON.stringify({
              type: "CREATE_ROOM",
              name,
              preferredColor,
              initialState: {
                board: Array(8)
                  .fill(null)
                  .map(() => Array(8).fill(null)),
                turn: "white",
              },
            })
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    [ws]
  );

  const requestJoin = useCallback(
    async (roomId: string) => {
      if (!ws) return;

      return new Promise<void>((resolve, reject) => {
        try {
          ws.send(
            JSON.stringify({
              type: "REQUEST_JOIN",
              roomId,
            })
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    [ws]
  );

  const value = {
    connect,
    createRoom,
    requestJoin,
    currentRoom,
    ws,
    isMyTurn,
    makeMove,
    playerColor,
    setBoard,
    gameStatus,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
