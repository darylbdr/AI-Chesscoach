import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './App.css'

function App() {
  const [game, setGame] = useState(new Chess())
  
    return (
      <div style={{ width: '500px', margin: '50px auto 50px 100px' }}>
        <Chessboard position={game.fen()} />
      </div>
    );
}

export default App
