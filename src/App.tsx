import { ChessBoard } from "./components/ChessBoard";
import { GameLobby } from "./components/GameLobby";
import { GameProvider } from "./contexts/GameContext";

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[min(90vw,90vh)] flex flex-col items-center">
          <GameLobby />
          <ChessBoard />
        </div>
      </div>
    </GameProvider>
  );
}

export default App;
