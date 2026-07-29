import { useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard'
import './App.css'

function App() {
  const [game, setGame] = useState(new Chess())
  const [bestMove, setBestMove] = useState('');
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});

  function onSquareClick() {
    setSquareStyles({});
  }
  
  function onSquareRightClick(args: SquareHandlerArgs) {
    setSquareStyles((prev: any) => {
      const newSquareStyles = {
        ...prev
      };
      if (newSquareStyles[args.square]) {
        delete newSquareStyles[args.square];
      } else {
        newSquareStyles[args.square] = {
          backgroundColor: 'rgba(255,0,0,0.2)'
        };
      }
      return newSquareStyles;
    });
  }

  async function findBestMove(gameCopy: Chess){
    fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fen: gameCopy.fen(), pgn:gameCopy.pgn() })
    }).then(response => response.json())
      .then(data => {
        setBestMove(data.best_move)
      })
      .catch(error => {
        console.error("Error during communication:", error)
      })
  }
    
  const chessboardOptions = {
    arrows: bestMove ? [{
        startSquare: bestMove.substring(0, 2) as Square,
        endSquare: bestMove.substring(2, 4) as Square,
        color: 'rgba(6, 134, 138, 0.9)'
      }] : undefined,
    position: game.fen(),
    onSquareClick,
    onSquareRightClick,
    squareStyles,
    onPieceDrop: onDrop
  }

  function onDrop({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) {
    if (!targetSquare){
      return false;
    }
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());

    try {
      const newGameBoard = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" })
      if (!newGameBoard) return false;

      setGame(gameCopy);
      findBestMove(gameCopy);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div style={{ width: '500px', margin: '50px auto 50px 100px' }}>
      <Chessboard options={chessboardOptions} />
    </div>
  );
}

export default App
