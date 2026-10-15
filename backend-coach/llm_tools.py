from utils import PIECE_NAMES

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

    def get_stockfish_best_move():
        """
        Allowing to get the best possible move from the stockfish engine.
        returns:
        best_move (str) :  a string of move in algebraic notation or None.
        """
        best_move = stockfish_engine.get_best_move()
        return best_move 
        
    def play_move(move: str):
        """
            Allowing to play a move and get both the evaluation and the new board after that given move.
            This is useful when trying to find tactics.
            Args:
                move(str): A str containing the move we want to try.
                a move is a string composed of the origin square and destination square, for instance when moving a piece from a2 to a3 we should give the argument "a2a3".
            returns:
                a dictionary containing the evaluation before making the which is a tuple containing a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" 
                (-1 means black has a mate in one, +1 means its white and 0 means the game is over)
                and the new board state  dictionary containing information about the side to move, all both the white and black pieces and their respective positions on the board.
                And finally the evaluation after making the move.
        """
        eval_before = stockfish_engine.get_evaluation()
        stockfish_engine.make_moves_from_current_position([move])
        eval_after = stockfish_engine.get_evaluation()
        new_board = get_board_representation()
        return {
        "evaluation_before": eval_before,
        "evaluation_after": eval_after,
        "new_board_state": new_board
        }

    def try_move(move_try: str):
        """
        Allowing to try a move and get the evaluation before and after making that move in order to know if its a good or bad move.
        This is useful to evaluate a possible move consequence in order to guess if it is good or not.
        Args:
            move(str): A str containing the move we want to try.
            a move is a string composed of the origin square and destination square, for instance when moving a piece from a2 to a3 we should give the argument "a2a3".
        returns:
            a dictionary containing the move that has been tried, the value of the evaluation before making that move and the value of the evaluation after making it.
            both evaluations are tuples containing a dictionary of the current advantage with "type" as "cp" (centipawns) or "mate" (checkmate in).
            But also every board information after the move.
        """
        eval_before = stockfish_engine.get_evaluation()
        stockfish_engine.make_moves_from_current_position([move_try])
        board_after_move = get_board_representation()
        eval_after = stockfish_engine.get_evaluation()
        stockfish_engine.set_fen_position(fen_position)

        return {
            "move_tried": move_try,
            "evaluation_before": eval_before,
            "evaluation_after":  eval_after,
            "board_after_move": board_after_move
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