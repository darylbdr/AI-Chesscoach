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
    }:PieceDropHandlerArgs) {
      const gameCopy = new Chess(game.fen())
      const newGameBoard = gameCopy.move({from: sourceSquare, to: targetSquare, promotion:"q"})
      if (!newGameBoard) return false;

      setGame(gameCopy)
      return true;
  }

  return (
      <div style={{ width: '500px', margin: '50px auto 50px 100px'}}>
        <Chessboard options={chessboardOptions}/>
      </div>
    );
}

export default App
