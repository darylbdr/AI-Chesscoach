from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/analyze")
def analyze_position(position: Position):
    print(f"position received from React: {position.fen}")

    return {
        "evaluation": "+1.5",
        "best_move": "e2e4"
    }

