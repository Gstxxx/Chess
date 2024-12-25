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
    <div className="p-4 w-full max-w-[min(90vw,90vh)]">
      {currentRoom ? (
        <div className="text-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold">
            Current Room: {currentRoom.name}
          </h2>
          <p className="text-sm text-gray-600">ID: {currentRoom.id}</p>
          <p className="text-sm text-gray-600">
            Playing as: {currentRoom.playerColor}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Available Rooms</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinForm(true)}
                className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-2 rounded text-sm md:text-base"
              >
                Join by ID
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex-1 sm:flex-none bg-blue-500 text-white px-4 py-2 rounded text-sm md:text-base"
              >
                Create Room
              </button>
            </div>
          </div>

          {showJoinForm && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowJoinForm(false)}
              />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl w-[90%] max-w-md">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">Join Room</h3>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter Room ID"
                    className="border p-2 rounded w-full mb-4"
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
              </div>
            </>
          )}

          {showCreateForm && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowCreateForm(false)}
              />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl w-[90%] max-w-md">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">Create Room</h3>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Room Name"
                    className="border p-2 rounded w-full mb-4"
                  />
                  <div className="flex gap-2 mb-4">
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
              </div>
            </>
          )}

          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border p-3 md:p-4 rounded flex flex-col sm:flex-row justify-between gap-2 sm:items-center"
              >
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    {room.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Players: {room.hasWhite ? "White " : ""}
                    {room.hasBlack ? "Black" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded text-sm md:text-base"
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
