import { useEffect, useRef, useState } from 'react'
import { Chess, type Square, type Move } from 'chess.js'
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard'
import './App.css'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

function ChessPage({game} : {game: Chess}) {
  const [gameCopy, setGameCopy] = useState(new Chess());
  const [bestMove, setBestMove] = useState('');
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [stockfishDepth, setStockfishDepth] = useState(0);
  const [stockfishEval, setStockfishEval] = useState<[string, number]>(['', 0]);
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const rawHistory = game.history();
  const verboseHistory = game.history({verbose: true});
  const formattedHistory = formatMoveHistory(rawHistory);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const totalMoves = rawHistory.length;

  useEffect(() => {
    fillFenHistory();
  }, [game]);

  useEffect(()=> {

    const el = historyRef.current;
    if (!el) return;
    
    const table = el.querySelector('tbody');
    if (!table) return;
    const tableIndex = (currentMoveIndex < 0) ? 0 : Math.floor(currentMoveIndex / 2)
    const moveRow = table.children[tableIndex];
    moveRow.scrollIntoView({behavior: 'smooth', block:'center'})

  }, [currentMoveIndex])

  function formatMoveHistory(history: string[]){
    const movePairs = [];

    for (let i = 0; i< history.length; i+= 2){
      const whiteMove = history[i]
      const blackMove = history[i+1] ?? undefined
      movePairs.push([whiteMove, blackMove])
    }
    return movePairs;
  }
  
  function formatEval(stockfishEvaluation: [string, number]){
    if (stockfishEvaluation[0] === "mate"){
      if (stockfishEval[1] != 0) return `#${Math.round(stockfishEval[1] * 100)}`
      else return "-"
    }
    else {
      return  `${(stockfishEval[1] > 0) ? '+' : ''}${stockfishEval[1].toFixed(1)}`
    }
  }


  function fillFenHistory(){
    const fullGame = new Chess();
    const history:string[] = [];
    for (const move of verboseHistory) {
      fullGame.move({from: move.from, to: move.to, promotion: move.promotion})
      history.push(fullGame.fen())
    }

    setFenHistory(history);
  }

  function chessMove(actualMove: Move){
    if (!actualMove) return false;

    const nextGame = new Chess(gameCopy.fen())
    nextGame.move({
      from: actualMove.from,
      to: actualMove.to,
      promotion: actualMove.promotion,
    });

    setGameCopy(nextGame);
    setSquareStyles({
      [actualMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, 
      [actualMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } 
    });

    return true;
  }

  function goToFirstMove(){
    setCurrentMoveIndex(-1);
    setGameCopy(new Chess());
    setSquareStyles({});
  }

  function goToLastMove(){
    const lastIndex = totalMoves - 1
    setCurrentMoveIndex(lastIndex);
    setGameCopy(new Chess(fenHistory[lastIndex]))

    setSquareStyles({
        [verboseHistory[lastIndex].from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, 
        [verboseHistory[lastIndex].to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } 
      });
  }

  function goToNextMove(){
    const nextIndex = currentMoveIndex + 1
    if (nextIndex > totalMoves - 1) return

    setCurrentMoveIndex(nextIndex);
    chessMove(verboseHistory[nextIndex]);
  }

  function goTopreviousMove(){
    
    if (currentMoveIndex == 0) {
      setGameCopy(new Chess());
    }
    else if (currentMoveIndex < 0) return;

    const prevIndex = currentMoveIndex - 1;
    setCurrentMoveIndex(prevIndex);
    setGameCopy(new Chess(fenHistory[prevIndex]));

    if (prevIndex >= 0){
      setSquareStyles({
        [verboseHistory[prevIndex].from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, 
        [verboseHistory[prevIndex].to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } 
      });
    }

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

  useEffect(() => {
    console.log("sending chess position to stockfish");

    const eventSource = new EventSource(`http://localhost:8000/analyze-stream?fen=${encodeURIComponent(gameCopy.fen())}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setBestMove(data.best_move);
        setStockfishDepth(data.depth);
        const evaluation = data.eval
        console.log(evaluation)
        setStockfishEval([evaluation.type, evaluation.value / 100]);
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error or connection closed by server:", error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    }
  }, [gameCopy]);
    
  const chessboardOptions = {
    arrows: bestMove ? [{
        startSquare: bestMove.substring(0, 2) as Square,
        endSquare: bestMove.substring(2, 4) as Square,
        color: 'rgba(6, 134, 138, 0.9)'
      }] : undefined,
    position: gameCopy.fen(),
    onSquareClick,
    onSquareRightClick,
    squareStyles,
    // onPieceDrop: onDrop,
    boardStyle: {width: '80vh'}
  }

  // function onDrop({
  //   sourceSquare,
  //   targetSquare,
  // }: PieceDropHandlerArgs) {
  //   if (!targetSquare){
  //     return false;
  //   }

  //   try {
  //     const newGameBoard = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" })
  //     if (!newGameBoard) return false;

  //     setGameCopy(gameCopy);
  //     setSquareStyles({
  //       [newGameBoard.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, 
  //       [newGameBoard.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } 
  //   });
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // }

  return (
    <div style={{ margin: '50px auto 50px 250px', display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch', position:'relative'}}>
      <Chessboard options={chessboardOptions}/>
  
      <div className="history-container" style={{maxHeight: '55vh'}}>
        <div style={{ textAlign: 'left', marginBottom: '10px', marginLeft: '6px', display: 'flex', flexDirection: 'row'}}>
          <p style={{fontSize: '30px', fontWeight:'bold', marginRight: '50px'}}>
            {formatEval(stockfishEval)}
            </p> 
          <p style={{fontSize: '30px'}}>depth : {stockfishDepth}</p> 
        </div>
        <div ref={historyRef} style = {{overflowY: 'auto', maxHeight: '70vh'}}>
          <table style={{borderCollapse: 'collapse', width: '100%'}}>
            <tbody>
              
              {formattedHistory.map((pair, index) =>{

                const isLastWhiteMove = currentMoveIndex >= 0 && currentMoveIndex === index * 2;
                const isLastBlackMove = currentMoveIndex >= 0 && currentMoveIndex === index * 2 + 1;

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
                      paddingRight: '170px',
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

      <div className="replay-binds" style={{alignSelf: 'flex-start', position: 'absolute', left: '85vh'}}>

        <button onClick={goToFirstMove} style={{paddingRight: '55px', marginRight: '16px', marginLeft: '139px', marginTop:'76vh', backgroundColor: 'rgb(22, 23, 29)', paddingTop: '10px', border:'None'}}>
           <ChevronsLeft size={30} strokeWidth={3.2} color="gray"/>
        </button>

        <button onClick={goTopreviousMove} style={{paddingRight: '16px', marginRight: '16px', backgroundColor: 'rgb(22, 23, 29)', border:'None' }}>
           <ChevronLeft size={30} strokeWidth={3.2} color="gray"/>
        </button>

        <button onClick={goToNextMove} style={{paddingLeft: '16px', marginRight: '16px', backgroundColor: 'rgb(22, 23, 29)', border:'None' }}>
           <ChevronRight size={30} strokeWidth={3.2} color="gray"/> 
        </button>

        <button onClick={goToLastMove} style={{paddingRight: '16px', marginRight: '16px', backgroundColor: 'rgb(22, 23, 29)', border:'None'}}>
          <ChevronsRight size={30} strokeWidth={3.2} color="gray"/>
        </button>

      </div>
    </div>

  );
}

export default ChessPage;
