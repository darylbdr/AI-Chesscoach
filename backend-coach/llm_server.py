from fastapi import FastAPI
# from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish
from llm import analyze_question
import uvicorn

engine_path = "../stockfish/stockfish-windows-x86-64-avx2.exe"
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],           
    allow_credentials=True,         
    allow_methods=["*"],             
    allow_headers=["board"],            
)

@app.get("/LLM-answer")
def get_LLM_answer(fen: str, question: str):
    stockfish_engine = Stockfish(path=engine_path)
    try:
        stockfish_engine.set_fen_position(fen)
        stockfish_engine.set_turn_perspective(False)
        stockfish_engine.set_depth(12)
        LLM_answer = analyze_question(question=question, fen=fen, stockfish_engine=stockfish_engine)
        
        return LLM_answer
    finally:
        stockfish_engine.send_quit_command()

uvicorn.run(app, host="127.0.0.1", port=8001)
