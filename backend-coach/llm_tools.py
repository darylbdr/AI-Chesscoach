from main import engine_path
from utils import PIECE_NAMES
from stockfish import Stockfish

stockfish_engine = Stockfish(path=engine_path)
fen_position = "r2q1rk1/pp3pp1/4pb1p/3p4/3n2P1/2NBQ2P/PPP2P2/2KR3R w - - 0 14"

def call_function(tool):
    result = ""
    try:
        match tool.function.name:
            case "get_stockfish_best_move":
                result = get_stockfish_best_move()
            case "try_moves_sequence":
                result = try_moves_sequence(fen_position, **tool.function.arguments)
            case "get_board_representation":
                result = get_board_representation()
    except Exception as e:
        return f'Error {e} occurred'

    if result == "":
        return f'Error: Unknow function name {tool.function.name}'

    return result

def get_stockfish_best_move():
    """
    Allowing to get the best move and evaluation of that move from stockfish engine.
    returns:
       tuple (str, dict):  A tuple composed of a string of move in algebraic notation or None, if it's a mate now 
       and a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in)

    """
    stockfish_engine.set_fen_position(fen_position)
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

def get_board_representation():
    """
    Returns the exact current state of the chessboard.
    Use this tool whenever the user asks about the current position of any piece, pawn, square, board configuration,
    or which pieces are present on the board.
    """
    # stockfish_engine.set_fen_position(fen_position)
    piece_placement = fen_position.split()[0]
    
    pieces = []
    board = {}

    files = "abcdefgh"

    for rank, row in zip(range(8, 0, -1), piece_placement.split("/")):
        file_index = 0

        for char in row:
            if char.isdigit():
                file_index += int(char)
                continue

            square = f"{files[file_index]}{rank}"
            piece_name = PIECE_NAMES[char]
            board[square] = piece_name
            pieces.append({
                "square": square,
                "piece": piece_name
            })

            file_index += 1
    
    white_pawns = [
        p["square"]
        for p in pieces
        if p["piece"] == "white_pawn"
    ]

    black_pawns = [
        p["square"]
        for p in pieces
        if p["piece"] == "black_pawn"
    ]

    other_white_pieces = [
        p for p in pieces
        if p["piece"].startswith("white_") and p["piece"] != 'white_pawn'
    ]

    other_black_pieces = [
        p for p in pieces
        if p["piece"].startswith("black_") and p["piece"] != 'black_pawn'
    ]

    return {
        # "fen": fen_position,
        "side_to_move": fen_position.split()[1],
        "white_pawns": white_pawns,
        "black_pawns": black_pawns,
        "other_white_pieces": other_white_pieces,
        "other_black_pieces": other_black_pieces,
    }