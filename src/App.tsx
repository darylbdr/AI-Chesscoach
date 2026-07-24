import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard'
import './App.css'

function App() {
  const [game, setGame] = useState(new Chess())
  const chessboardOptions = {
    position: game.fen(),
    onPieceDrop: onDrop
  }

  function onDrop({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    const newGameBoard = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" })
    if (!newGameBoard) return false;

    setGame(gameCopy)
    fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fen: gameCopy.fen(), pgn:gameCopy.pgn() })
    }).then(response => response.json())
      .then(data => {
        console.log("The coach said: ", data)
      })
      .catch(error => {
        console.error("Error during communication:", error)
      })
    return true;
  }

  return (
    <div style={{ width: '500px', margin: '50px auto 50px 100px' }}>
      <Chessboard options={chessboardOptions} />
    </div>
  );
}

export default App
