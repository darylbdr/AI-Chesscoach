import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './App.css'

function App() {
  const [game, setGame] = useState(new Chess())

  function onDrop(sourceSquare: string, targetSquare: string) {
    const gameCopy = new Chess(game.fen())
    const newGameBoard = gameCopy.move({from: sourceSquare, to: targetSquare, promotion:"q"})
    if (!newGameBoard){
      return false;
    }
    else {
      setGame(gameCopy)
      return true;
    }
  }

    return (
      <div style={{ width: '500px', margin: '50px auto 50px 100px'}}>
        <Chessboard onPieceDrop={onDrop} position={game.fen()} />
      </div>
    );
}

export default App
