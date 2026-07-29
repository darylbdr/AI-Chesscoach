import { useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard'
import './App.css'

function App() {
  const [game, setGame] = useState(new Chess())
  const [bestMove, setBestMove] = useState('');
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const rawHistory = game.history();
  const formattedHistory = formatMoveHistory(rawHistory);

  console.log(formattedHistory);
  function formatMoveHistory(history: string[]){
    const movePairs = [];

    for (let i = 0; i< history.length; i+= 2){
      const whiteMove = history[i]
      const blackMove = history[i+1] ?? undefined
      movePairs.push([whiteMove, blackMove])
    }
    return movePairs;
  }


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
    <div style={{ margin: '50px auto 50px 250px' , display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch'}}>
      <Chessboard options={chessboardOptions}/>
      
      <div style={{ width: "50%", position: 'relative', overflowY: 'auto'}}>
        <div className="history-container" style={{ overflowY: 'auto', flex: 1, position: 'absolute'}}>
        <table style={{borderCollapse: 'collapse', width: '100%'}}>
          <tbody>
            
            {formattedHistory.map((pair, index) =>{
              const totalMoves = rawHistory.length;
              const isLastWhiteMove =  (index * 2) == (totalMoves - 1)
              const isLastBlackMove =  (index * 2) + 1 == (totalMoves - 1)

              return (
                <tr key={index}>

                  <td style={{
                    paddingRight: '55px',
                    color: 'gray',
                    paddingLeft: '10px',
                    backgroundColor: '#313442f7' ,
                    borderRight: '1px solid #141621',
                    margin: 0
                  }}>{index + 1}.</td>

                  <td style={{
                    paddingLeft: '5px' ,
                    paddingRight: '200px',
                    borderRight: '1px solid #29292a',
                    backgroundColor: isLastWhiteMove ? '#1b31937d' : "rgb(22, 23, 29)"
                  }}>{pair[0]}</td>

                  <td style={{
                    paddingLeft: '10px',
                    paddingRight: '200px',
                    borderRight: '1px solid #29292a',
                    backgroundColor: isLastBlackMove ? '#1b31937d' : "rgb(22, 23, 29)"
                  }}>{pair[1] ?? ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>
      
    </div>

  );
}

export default App
