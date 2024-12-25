import { WebSocketServer, WebSocket as WS } from "ws";
import { v4 as uuidv4 } from "uuid";
import type { ChessPiece } from "../src/types/chess";

interface GameState {
  board: (ChessPiece | null)[][];
  turn: "white" | "black";
  gameOver?: "white" | "black" | "draw";
}

interface GameRoom {
  id: string;
  name: string;
  players: {
    white?: WS;
    black?: WS;
  };
  spectators: WS[];
  gameState: GameState;
  createdAt: Date;
}

const wss = new WebSocketServer({ port: 8080 });

const gameRooms = new Map<string, GameRoom>();

wss.on("connection", (ws: WS) => {
  console.log("New client connected");

  // Send initial rooms list
  const roomsList = Array.from(gameRooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    hasWhite: !!room.players.white,
    hasBlack: !!room.players.black,
    createdAt: room.createdAt,
  }));
  ws.send(JSON.stringify({ type: "ROOMS_LIST", rooms: roomsList }));

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);
    console.log("Received message:", data);

    switch (data.type) {
      case "CREATE_ROOM": {
        const newRoomId = uuidv4();
        gameRooms.set(newRoomId, {
          id: newRoomId,
          name: data.name,
          players: { [data.preferredColor]: ws },
          spectators: [],
          gameState: data.initialState,
          createdAt: new Date(),
        });

        // Notify creator
        ws.send(
          JSON.stringify({
            type: "ROOM_CREATED",
            roomId: newRoomId,
            color: data.preferredColor,
          })
        );

        // Broadcast updated rooms list
        broadcastRoomsList();
        break;
      }

      case "REQUEST_JOIN": {
        const targetRoom = gameRooms.get(data.roomId);
        if (!targetRoom) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Room not found" }));
          return;
        }

        const availableColor = !targetRoom.players.white
          ? "white"
          : !targetRoom.players.black
          ? "black"
          : null;

        if (!availableColor) {
          ws.send(
            JSON.stringify({ type: "ERROR", message: "Room is already full" })
          );
          return;
        }

        // Directly join the room with available color
        targetRoom.players[availableColor] = ws;

        // Notify the joining player
        ws.send(
          JSON.stringify({
            type: "JOINED_ROOM",
            roomId: data.roomId,
            name: targetRoom.name,
            color: availableColor,
          })
        );

        // Notify other player
        const otherPlayer =
          availableColor === "white"
            ? targetRoom.players.black
            : targetRoom.players.white;
        otherPlayer?.send(JSON.stringify({ type: "OPPONENT_JOINED" }));

        broadcastRoomsList();
        break;
      }

      case "ACCEPT_JOIN": {
        const room = gameRooms.get(data.roomId);
        if (!room) return;

        const joiningPlayer = data.playerSocket;
        const color = !room.players.white ? "white" : "black";

        room.players[color] = joiningPlayer;
        joiningPlayer.send(
          JSON.stringify({ type: "JOINED_ROOM", color, roomId: data.roomId })
        );

        // Notify both players
        room.players.white?.send(
          JSON.stringify({ type: "GAME_STARTED", color: "white" })
        );
        room.players.black?.send(
          JSON.stringify({ type: "GAME_STARTED", color: "black" })
        );

        broadcastRoomsList();
        break;
      }

      case "GET_ROOMS":
        ws.send(JSON.stringify({ type: "ROOMS_LIST", rooms: roomsList }));
        break;

      case "MOVE": {
        const room = gameRooms.get(data.roomId);
        if (!room) return;

        // Update the game state in the room
        room.gameState = data.gameState;

        // Broadcast the move to both players
        const moveData = JSON.stringify({
          type: "MOVE",
          move: data.move,
          gameState: data.gameState,
        });

        // Send to both players
        room.players.white?.send(moveData);
        room.players.black?.send(moveData);

        break;
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    cleanupRooms(ws);
  });
});

function broadcastRoomsList() {
  const roomsList = Array.from(gameRooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    hasWhite: !!room.players.white,
    hasBlack: !!room.players.black,
    createdAt: room.createdAt,
  }));

  wss.clients.forEach((client) => {
    if (client.readyState === WS.OPEN) {
      client.send(JSON.stringify({ type: "ROOMS_LIST", rooms: roomsList }));
    }
  });
}

function cleanupRooms(ws: WS) {
  for (const [roomId, room] of gameRooms.entries()) {
    if (room.players.white === ws || room.players.black === ws) {
      gameRooms.delete(roomId);
      // Notify other player if exists
      const otherPlayer =
        room.players.white === ws ? room.players.black : room.players.white;
      otherPlayer?.send(JSON.stringify({ type: "OPPONENT_LEFT" }));
      broadcastRoomsList();
    }
  }
}

console.log("WebSocket server running on ws://localhost:8080");
