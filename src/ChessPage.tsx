import { useEffect, useRef, useState} from 'react'
import { Chess, type Square, type Move } from 'chess.js'
import { Chessboard, type SquareHandlerArgs } from 'react-chessboard'
import './App.css'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import botImage from './assets/bot_image.png'

type ChatMessage = {
  id: number;
  question: string;
  answer: string;
};

type CoachRequest = {
  id: number;
  question: string;
  fen: string;
};

function ChessPage({game} : {game: Chess}) {
  const [gameCopy, setGameCopy] = useState(new Chess());
  const [bestMove, setBestMove] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [coachRequest, setCoachRequest] = useState<CoachRequest | null>(null);
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
    const tableIndex = (currentMoveIndex < 0) ? 0 : Math.floor(currentMoveIndex / 2);
    const moveRow = table.children[tableIndex] as HTMLElement | undefined;
    if (!moveRow) return;

    const rowTop = moveRow.offsetTop;
    const targetScrollTop = rowTop - (el.clientHeight / 2) + (moveRow.clientHeight / 2);
    el.scrollTo({ top: targetScrollTop, behavior: 'smooth' });

  }, [currentMoveIndex])

  useEffect(()=>{
    function handleKeyDown(event: globalThis.KeyboardEvent){
      if (document.activeElement?.tagName === "INPUT"){
        return;
      }
      else {
        if (event.key == "ArrowRight"){
          event.preventDefault();
          goToNextMove();
        }
        else if (event.key == "ArrowLeft"){
          event.preventDefault();
          goTopreviousMove();
        }
        else if (event.key == "ArrowUp"){
          event.preventDefault();
          goToFirstMove();
        }
        else if (event.key == "ArrowDown"){
          event.preventDefault();
          goToLastMove();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {window.removeEventListener("keydown", handleKeyDown)}
    }, [currentMoveIndex, fenHistory])

  function formatMoveHistory(history: string[]){
    const movePairs = [];

    for (let i = 0; i< history.length; i+= 2){
      const whiteMove = history[i]
      const blackMove = history[i+1] ?? undefined
      movePairs.push([whiteMove, blackMove])
    }
    return movePairs;
  }

  function formatEval([type, value]: [string, number]){
    if (type === "mate") {
      return value !== 0 ? `#${Math.round(value * 100)}` : "-";
    }

    return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
  }

  function getWhiteEvalPercentage([type, value]: [string, number]): number {
    if (type === "mate") {
      if (value > 0) return 100;
      if (value < 0) return 0;
      return gameCopy.turn() === 'b' ? 100 : 0;
    }

    const percentage = 100 / (1 + Math.exp(-0.4 * value));
    return Math.min(95, Math.max(5, percentage));
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

  function askCoach(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question) return;

    const requestId = Date.now();
    setChatMessages((messages) => [
      ...messages,
      {
        id: requestId,
        question,
        answer: 'Le coach analyse la position...',
      },
    ]);
    setCoachRequest({
      id: requestId,
      question,
      fen: gameCopy.fen(),
    });
    setChatInput('');
  }

  useEffect(() => {
    if (!coachRequest) return;

    const request = coachRequest;
    const controller = new AbortController();

    async function getCoachAnswer() {
      try {
        const params = new URLSearchParams({
          fen: request.fen,
          question: request.question,
        });
        const response = await fetch(`http://localhost:8001/LLM-answer?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`LLM server returned HTTP ${response.status}`);
        }

        const answer = await response.json() as string;
        setChatMessages((messages) =>
          messages.map((message) =>
            message.id === request.id
              ? { ...message, answer }
              : message
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Unable to retrieve the LLM answer:', error);
        setChatMessages((messages) =>
          messages.map((message) =>
            message.id === request.id
              ? { ...message, answer: 'Impossible de get the coach answer.' }
              : message
          )
        );
      }
    }

    void getCoachAnswer();

    return () => {
      controller.abort();
    };
  }, [coachRequest]);

  useEffect(() => {
    console.log("sending chess position to stockfish");

    const eventSource = new EventSource(`http://localhost:8000/analyze-stream?fen=${encodeURIComponent(gameCopy.fen())}`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setBestMove(data.best_move);
        setStockfishDepth(data.depth);
        const evaluation = data.eval;
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
    <div className="chess-page">
      <div className="analysis-row">
        <div className="board-with-eval">
          <div
            className="eval-bar"
            role="meter"
            aria-label="Position evaluation bar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(getWhiteEvalPercentage(stockfishEval))}
          >
            <div
              className="eval-bar-white"
              style={{ height: `${getWhiteEvalPercentage(stockfishEval)}%` }}
            />
          </div>
          <Chessboard options={chessboardOptions}/>
        </div>
        <div className="analysis-sidebar">
          <div className="history-container">
            <div className="history-headings">
              <p>{formatEval(stockfishEval)}</p>
              <p>Depth {stockfishDepth}</p>
            </div>
            <div className="history-scroll" ref={historyRef}>
              <table className="history-table">
                <tbody>

                  {formattedHistory.map((pair, index) =>{

                    const isLastWhiteMove = currentMoveIndex >= 0 && currentMoveIndex === index * 2;
                    const isLastBlackMove = currentMoveIndex >= 0 && currentMoveIndex === index * 2 + 1;

                    return (
                      <tr key={index}>

                        <td className="move-number">{index + 1}.</td>
                        <td className={isLastWhiteMove ? 'selected-move' : ''}>{pair[0]}</td>
                        <td className={isLastBlackMove ? 'selected-move' : ''}>{pair[1] ?? ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="replay-binds">

            <button onClick={goToFirstMove} aria-label="First move">
              <ChevronsLeft size={30} strokeWidth={3.2} />
            </button>

            <button onClick={goTopreviousMove} aria-label="Previous move">
              <ChevronLeft size={30} strokeWidth={3.2} />
            </button>

            <button onClick={goToNextMove} aria-label="Next move">
              <ChevronRight size={30} strokeWidth={3.2} />
            </button>

            <button onClick={goToLastMove} aria-label="Last move">
              <ChevronsRight size={30} strokeWidth={3.2} />
            </button>

          </div>
        </div>
      </div>

      <section className="coach-chat" aria-label="Chess coach chat">
        <div className='coach-chat-header'>
          <img className="coach-avatar" src={botImage} alt="Chess coach bot" />
          <p style={{fontWeight: 'bold', fontSize:'25px', marginTop:'10px'}}>ASK QUESTIONS TO THE CHESS COACH</p>
        </div>
        <div className="coach-chat-content">
          {chatMessages.length > 0 && (
            <div className="coach-response" aria-live="polite">
              {chatMessages.map((message, index) => (
                <div className="coach-message" key={`${message.id}-${index}`}>
                  <p className="coach-question">You: {message.question}</p>
                  <p className="coach-answer">Coach: {message.answer}</p>
                </div>
              ))}
            </div>
          )}
          <form className="coach-input-form" onSubmit={askCoach}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Write your question..."
              aria-label="Question for the chess coach"
            />
            <button type="submit">Ask</button>
          </form>
        </div>
      </section>
    </div>

  );
}

export default ChessPage;
