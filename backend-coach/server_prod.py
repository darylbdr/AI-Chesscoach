import json
import os
import shutil
import time
import secrets
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from stockfish import Stockfish
from llm import analyze_question
import uvicorn

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admin_chess_2026")
SESSION_DURATION_SECONDS = int(os.getenv("SESSION_DURATION_SECONDS", "300"))  # 5 minutes

# Stockage en mémoire des tokens d'amis:
# { "token_str": { "first_used_at": float | None, "duration": int } }
INVITE_TOKENS: dict[str, dict] = {}

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

def validate_token(token: str | None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Access token required.")
    
    # 1. Admin: accès permanent illimité
    if token == ADMIN_TOKEN:
        return {"role": "admin", "remaining_seconds": -1}
    
    # 2. Token invité
    session = INVITE_TOKENS.get(token)
    if not session:
        raise HTTPException(status_code=403, detail="Invalid or unknown access token.")
    
    now = time.time()
    if session["first_used_at"] is None:
        session["first_used_at"] = now
    
    elapsed = now - session["first_used_at"]
    remaining = session["duration"] - elapsed
    
    if remaining <= 0:
        raise HTTPException(status_code=403, detail="Your 5-minute demo session has expired.")
    
    return {"role": "guest", "remaining_seconds": int(remaining)}

@app.get("/api/verify-token")
def check_token(token: str = Query(...)):
    try:
        status = validate_token(token)
        return {"valid": True, **status}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"valid": False, "detail": e.detail})

@app.get("/api/create-token")
def create_guest_token(admin_token: str = Query(...)):
    if admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Admin authorization required.")
    
    new_token = secrets.token_urlsafe(8)
    INVITE_TOKENS[new_token] = {
        "first_used_at": None,
        "duration": SESSION_DURATION_SECONDS,
    }
    return {
        "token": new_token,
        "expires_in_seconds_once_started": SESSION_DURATION_SECONDS,
        "url_param": f"?token={new_token}",
    }

@app.get("/analyze-stream", response_class=StreamingResponse)
def analyze_position(fen: str, token: str = Query(None)):
    validate_token(token)
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
def get_LLM_answer(fen: str, question: str, token: str = Query(None)):
    validate_token(token)
    stockfish_engine = Stockfish(path=engine_path)
    try:
        stockfish_engine.set_fen_position(fen)
        stockfish_engine.set_turn_perspective(False)
        stockfish_engine.set_depth(12)
        return analyze_question(
            question=question,
            fen=fen,
            stockfish_engine=stockfish_engine,
        )
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
