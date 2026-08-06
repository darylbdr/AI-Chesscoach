import json
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish

engine_path = "../stockfish/stockfish-windows-x86-64-avx2.exe"
# stockfish_engine = Stockfish(
#     path=engine_path,
#     depth=12,
#     parameters={"Threads": 2}
# )

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],           
    allow_credentials=True,         
    allow_methods=["*"],             
    allow_headers=["board"],            
)
class Position(BaseModel):
    fen: str
    pgn: str

@app.get("/analyze-stream", response_class=StreamingResponse)
def analyze_position(fen: str):
    def event_generator():
        stockfish_engine = Stockfish(path=engine_path)
        stockfish_depths = [12, 14, 16, 18, 20, 22, 24, 26]

        for depth in stockfish_depths:
            stockfish_engine.set_fen_position(fen)
            stockfish_engine.set_depth(depth)
            best_move = stockfish_engine.get_best_move()
            payload = json.dumps({
                "depth": depth,
                "best_move": best_move
            })

            yield f"data: {payload} \n\n"
        stockfish_engine.send_quit_command()
    
    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream'
    )
        # evaluation = stockfish_engine.get_evaluation()

def get_llm_response():
    pass
