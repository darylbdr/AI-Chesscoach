from main import stockfish_engine

def call_function(tool):
    result = ""
    try:
        match tool.function.name:
            case "get_stockfish_best_move":
                result = get_stockfish_best_move("r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14" , **tool.function.arguments)
            case "get_stockfish_evaluation":
                result = get_stockfish_evaluation("r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14", **tool.function.arguments)
    except Exception as e:
        return f'Error {e} occurred'

    if result == "":
        return f'Error: Unknow function name {tool.function.name}'

    return result

def get_stockfish_best_move(current_pgn:str):
    """
    Allowing to get the best move and evaluation of that move from stockfish engine.
    returns:
       tuple (str, dict):  A tuple composed of a string of move in algebraic notation or None, if it's a mate now 
       and a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in)

    """
    stockfish_engine.set_fen_position(current_fen)
    best_move = stockfish_engine.get_best_move()
    stockfish_engine.make_moves_from_current_position([best_move])
    evaluation = stockfish_engine.get_evaluation()
    return (best_move, evaluation)
    

def get_stockfish_evaluation(current_fen:str, move_seq: list):
    """
    Allowing to try a sequence of moves and get the evaluation after those given moves
    Args:
        move_seq (list): A sequence of moves
    returns:
        dict:  A dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in)
    """
    stockfish_engine.set_fen_position(current_fen)
    stockfish_engine.make_moves_from_current_position(move_seq)
    eval = stockfish_engine.get_evaluation()

    return eval