from main import stockfish_engine

def call_function(tool):
    result = ""
    try:
        match tool.function.name:
            case "get_stockfish_best_move":
                result = get_stockfish_best_move("r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14" , **tool.function.arguments)
            case "try_moves_sequence":
                result = try_moves_sequence("r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14", **tool.function.arguments)
            case "get_board_representation":
                result = get_board_representation("r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14")
    except Exception as e:
        return f'Error {e} occurred'

    if result == "":
        return f'Error: Unknow function name {tool.function.name}'

    return result

def get_stockfish_best_move(_current_fen:str):
    """
    Allowing to get the best move and evaluation of that move from stockfish engine.
    args:
        _current_fen (str): (For internal use only, do not set manually)
    returns:
       tuple (str, dict):  A tuple composed of a string of move in algebraic notation or None, if it's a mate now 
       and a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in)

    """
    stockfish_engine.set_fen_position(_current_fen)
    best_move = stockfish_engine.get_best_move()
    stockfish_engine.make_moves_from_current_position([best_move])
    evaluation = stockfish_engine.get_evaluation()
    return (best_move, evaluation)
    

def try_moves_sequence(_current_fen:str, move_seq: list):
    """
    Allowing to try a sequence of moves and get the evaluation after those given moves
    Args:
        _current_fen (str): (For internal use only, do not set manually)
        move_seq (list): A list containing the sequence of moves you want to try.
        Each move contains the origin square and destination square, for instance "a2a3" means moving a piece from a2 to a3,
        therefore that move should be noted 'a2a3'.
    returns:
        dict:  A dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in)
    """
    stockfish_engine.set_fen_position(_current_fen)
    stockfish_engine.make_moves_from_current_position(move_seq)
    eval = stockfish_engine.get_evaluation()

    return eval

def get_board_representation(_current_fen:str):
    """
    Allows to get a visual representation of the current board position from white view point.
    Args:
        _current_fen (str): (For internal use only, do not set manually)
    Returns:
        String of visual representation of the chessboard with its pieces in current position.
    """
    stockfish_engine.set_fen_position(_current_fen)
    representation = stockfish_engine.get_board_visual()
    return representation