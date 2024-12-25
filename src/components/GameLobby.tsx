import { useState, useEffect } from "react";
import { useGame } from "../hooks/useGame";

interface Room {
  id: string;
  name: string;
  hasWhite: boolean;
  hasBlack: boolean;
  createdAt: string;
}

interface WebSocketMessage {
  type: string;
  rooms?: Room[];
  roomId?: string;
  name?: string;
  color?: "white" | "black";
  message?: string;
}

export function GameLobby() {
  const { connect, createRoom, requestJoin, currentRoom, ws } = useGame();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [preferredColor, setPreferredColor] = useState<"white" | "black">(
    "white"
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent<string>) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      if (data.type === "ROOMS_LIST") {
        setRooms(data.rooms ?? []);
      }
    };

    const handleOpen = () => {
      ws.send(JSON.stringify({ type: "GET_ROOMS" }));
    };

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("open", handleOpen);
    };
  }, [ws]);

  const handleCreateRoom = async () => {
    if (!roomName) return;
    await createRoom(roomName, preferredColor);
    setShowCreateForm(false);
    setRoomName("");
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await requestJoin(roomId);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const handleJoinById = async () => {
    if (!joinRoomId) return;
    try {
      await requestJoin(joinRoomId);
      setShowJoinForm(false);
      setJoinRoomId("");
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  return (
    <div className="p-4">
      {currentRoom ? (
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">
            Current Room: {currentRoom.name}
          </h2>
          <p className="text-sm text-gray-600">ID: {currentRoom.id}</p>
          <p className="text-sm text-gray-600">
            Playing as: {currentRoom.playerColor}
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Available Rooms</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowJoinForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Join by ID
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Create Room
              </button>
            </div>
          </div>

          {showJoinForm && (
            <div className="mb-4 p-4 border rounded">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="border p-2 rounded w-full mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinById}
                  className="bg-green-500 text-white px-4 py-2 rounded flex-1"
                >
                  Join
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showCreateForm && (
            <div className="mb-4 p-4 border rounded">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
                className="border p-2 rounded w-full mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setPreferredColor("white")}
                  className={`flex-1 p-2 rounded ${
                    preferredColor === "white"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setPreferredColor("black")}
                  className={`flex-1 p-2 rounded ${
                    preferredColor === "black"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Black
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateRoom}
                  className="bg-green-500 text-white px-4 py-2 rounded flex-1"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border p-4 rounded flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{room.name}</h3>
                  <p className="text-sm text-gray-600">
                    Players: {room.hasWhite ? "White " : ""}
                    {room.hasBlack ? "Black" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  disabled={room.hasWhite && room.hasBlack}
                >
                  {room.hasWhite && room.hasBlack ? "Full" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
