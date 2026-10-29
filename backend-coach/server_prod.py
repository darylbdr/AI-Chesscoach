import json
import os
import shutil
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish
from llm import analyze_question
import uvicorn

def get_stockfish_path() -> str:
    env_path = os.getenv("STOCKFISH_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    system_stockfish = shutil.which("stockfish") or "/usr/games/stockfish"
    if os.path.exists(system_stockfish):
        return system_stockfish
    return "../stockfish/stockfish-windows-x86-64-avx2.exe"

engine_path = get_stockfish_path()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/analyze-stream", response_class=StreamingResponse)
def analyze_position(fen: str):
    def event_generator():
        stockfish_engine = Stockfish(path=engine_path)
        stockfish_depths = [12, 14, 16, 18, 20, 22]

        try:
            for depth in stockfish_depths:
                stockfish_engine.set_fen_position(fen)
                stockfish_engine.set_turn_perspective(False)
                stockfish_engine.set_depth(depth)
                best_move = stockfish_engine.get_best_move()
                eval_score = stockfish_engine.get_evaluation()
                payload = json.dumps({
                    "depth": depth,
                    "best_move": best_move,
                    "eval": eval_score,
                })
                yield f"data: {payload} \n\n"
        finally:
            stockfish_engine.send_quit_command()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@app.get("/LLM-answer")
def get_LLM_answer(fen: str, question: str):
    stockfish_engine = Stockfish(path=engine_path)
    try:
        stockfish_engine.set_fen_position(fen)
        stockfish_engine.set_turn_perspective(False)
        stockfish_engine.set_depth(12)
        return analyze_question(question=question, fen=fen, stockfish_engine=stockfish_engine)
    finally:
        stockfish_engine.send_quit_command()

dist_dir = Path(__file__).resolve().parent.parent / "dist"
if dist_dir.exists():
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        requested_file = dist_dir / full_path
        if full_path and requested_file.exists() and requested_file.is_file():
            return FileResponse(str(requested_file))
        return FileResponse(str(dist_dir / "index.html"))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
