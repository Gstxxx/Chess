import { ChessBoard } from "./components/ChessBoard";
import { GameLobby } from "./components/GameLobby";
import { GameProvider } from "./contexts/GameContext";

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <GameLobby />
          <ChessBoard />
        </div>
      </div>
    </GameProvider>
  );
}

export default App;
