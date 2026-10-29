import re
from utils import PIECE_NAMES

def clean_uci_move(move: str) -> str:
    """Extracts pure UCI coordinate move (e.g. 'Nd4b5' -> 'd4b5', 'e7e8q' -> 'e7e8q')."""
    squares = re.findall(r"[a-h][1-8]", move)
    if len(squares) >= 2:
        uci = squares[0] + squares[1]
        promo_match = re.search(r"[a-h][1-8]=?([qrbnQRBN])\b", move[2:])
        if promo_match and (squares[1][1] in ("1", "8")):
            uci += promo_match.group(1).lower()
        return uci
    return move.strip()

def create_tools(stockfish_engine, fen_position):
    
    def call_function(tool):
        result = ""
        try:
            match tool.function.name:
                case "get_stockfish_best_move":
                    result = get_stockfish_best_move(**tool.function.arguments)
                case "try_move":
                    result = try_move(**tool.function.arguments)
                case "play_move":
                    result = play_move(**tool.function.arguments)
                case "get_board_representation":
                    result = get_board_representation()
        except Exception as e:
            return f'Error {e} occurred'

        if result == "":
            return f'Error: Unknow function name {tool.function.name}'

        return result

    def get_square_piece_map():
        fen_str = stockfish_engine.get_fen_position()
        piece_placement = fen_str.split()[0]
        board = {}
        files = "abcdefgh"
        for rank, row in zip(range(8, 0, -1), piece_placement.split("/")):
            file_index = 0
            for char in row:
                if char.isdigit():
                    file_index += int(char)
                    continue
                square = f"{files[file_index]}{rank}"
                board[square] = PIECE_NAMES[char]
                file_index += 1
        return board

    def describe_move_impact(uci_move: str, board_before: dict):
        origin = uci_move[:2]
        dest = uci_move[2:4]
        moving_piece = board_before.get(origin, "unknown_piece")
        captured_piece = board_before.get(dest, None)
        if captured_piece is None and moving_piece.endswith("_pawn") and origin[0] != dest[0]:
            enemy_color = "black" if moving_piece.startswith("white_") else "white"
            captured_piece = f"{enemy_color}_pawn (en passant)"
        return moving_piece, (f"{captured_piece} on {dest}" if captured_piece else None)

    def get_stockfish_best_move():
        """
        Allowing to get the best possible move from the stockfish engine.
        returns:
        best_move (str) :  a string of move in coordinate notation (e.g. "e2e4") or None.
        eval: a dictionary containing the evaluation if playing the bestmove,
        which is a tuple containing a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" 
        (-1 means black has a mate in one, +1 means its white and 0 means the game is over).
        """
        best_move = stockfish_engine.get_best_move()
        eval = stockfish_engine.get_evaluation()
        return best_move, eval
        
    def play_move(move: str):
        """
            Allowing to play a move and get both the evaluation, the opponent's best reply, and the new board after that given move.
            This is useful when trying to find tactics and following a sequence of moves.
            Args:
                move(str): A 4-character string containing ONLY the origin square and destination square (e.g. "a2a3", "d4b5"). Do NOT include piece letters like "N", "B", "Q", "R", "K" (never write "Nd4b5").
            returns:
                a dictionary containing the evaluation before making the move which is a tuple containing a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" 
                (-1 means black has a mate in one, +1 means its white and 0 means the game is over),
                the evaluation after making the move,
                the opponent's best reply move (opponent_best_reply) in coordinate notation,
                and the new board state dictionary containing information about the side to move, all both the white and black pieces and their respective positions on the board.
        """
        move = clean_uci_move(move)
        board_before = get_square_piece_map()
        moving_piece, captured_piece = describe_move_impact(move, board_before)
        eval_before = stockfish_engine.get_evaluation()
        stockfish_engine.make_moves_from_current_position([move])
        eval_after = stockfish_engine.get_evaluation()
        opponent_best_reply = stockfish_engine.get_best_move()
        new_board = get_board_representation()
        return {
        "move_played": move,
        "moving_piece": moving_piece,
        "captured_piece": captured_piece,
        "evaluation_before": eval_before,
        "evaluation_after": eval_after,
        "opponent_best_reply": opponent_best_reply,
        "new_board_state": new_board
        }

    def try_move(move_try: str):
        """
        Allowing to quickly test a single candidate move and get the evaluation before and after making that move, WITHOUT changing the board position (the board is immediately reset after).
        WARNING: Because `try_move` resets the board back to the original position, you CANNOT play the opponent's reply after calling `try_move`. If you want to play a sequence of moves or see the opponent's reply, use `play_move` instead.
        Args:
            move_try(str): A 4-character string containing ONLY the origin square and destination square (e.g. "a2a3", "d4b5"). Do NOT include piece letters like "N", "B", "Q", "R", "K" (never write "Nd4b5").
        returns:
            a dictionary containing the move that has been tried, the value of the evaluation before making that move, the value of the evaluation after making it,
            and every board information after the move.
        """
        move_try = clean_uci_move(move_try)
        board_before = get_square_piece_map()
        moving_piece, captured_piece = describe_move_impact(move_try, board_before)
        fen_before_move = stockfish_engine.get_fen_position()
        eval_before = stockfish_engine.get_evaluation()
        stockfish_engine.make_moves_from_current_position([move_try])
        board_after_move = get_board_representation()
        eval_after = stockfish_engine.get_evaluation()
        stockfish_engine.set_fen_position(fen_before_move)

        return {
            "move_tried": move_try,
            "moving_piece": moving_piece,
            "captured_piece": captured_piece,
            "evaluation_before": eval_before,
            "evaluation_after":  eval_after,
            "board_after_move": board_after_move,
            "note": "Board has been reset to the position BEFORE move_tried. Use play_move(move_try) first if you want to play a continuation."
        }

    def get_board_representation():
        """
        Returns the exact current state of the chessboard.
        Use this tool whenever the user asks about the current position of any piece, pawn, square, board configuration,
        or which pieces are present on the board.
        """
        fen_position = stockfish_engine.get_fen_position()
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
            "side_to_move": fen_position.split()[1],
            "white_pawns": white_pawns,
            "black_pawns": black_pawns,
            "other_white_pieces": other_white_pieces,
            "other_black_pieces": other_black_pieces,
        }
    
    return {
        "tools" :[
            get_board_representation,
            get_stockfish_best_move,
            try_move,
            play_move,
        ],
        "call_function": call_function,
    }
