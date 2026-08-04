import { BrowserRouter, Route, Routes } from "react-router"
import { Chess} from 'chess.js'
import ChessPage from "./ChessPage";
import Home from "./Home";
import { useState } from "react";

function App() {
  const [game, setGame] = useState(new Chess())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home setGame={setGame}/>} />
        <Route path="/board" element={<ChessPage game={game}/>} />
      </Routes>
    </BrowserRouter>
  );
}


export default App