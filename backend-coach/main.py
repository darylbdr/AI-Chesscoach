from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish

engine_path = "../stockfish/stockfish-windows-x86-64-avx2.exe"
stockfish_engine = Stockfish(
    path=engine_path,
    depth=18,
    # parameters={"Threads": 2, "Minimum Thinking Time": 30}
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],           
    allow_credentials=True,         
    allow_methods=["*"],             
    allow_headers=["*"],            
)
class Position(BaseModel):
    fen: str
    pgn: str

@app.post("/analyze")
def analyze_position(position: Position):
    stockfish_engine.set_fen_position(position.fen)
    best_move = stockfish_engine.get_best_move()
    evaluation = stockfish_engine.get_evaluation()
    
    return {
        "best_move": best_move
    }

def get_llm_response():
    pass
