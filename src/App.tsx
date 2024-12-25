import { ChessBoard } from "./components/ChessBoard";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <ChessBoard />
      </div>
    </div>
  );
}

export default App;
