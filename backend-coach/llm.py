import ollama
from llm_tools import create_tools

CHESS_PROMPT = """
You are a direct, concrete, and pedagogical chess coach.
The current board state is NOT directly visible to you: ALWAYS call `get_board_representation` first before answering any question about the position.

HOW TO ANALYZE A MOVE OR BLUNDER:
1. Get the current board state with `get_board_representation`.
2. Play the move on the board using `play_move` (which advances the board and returns `opponent_best_reply`).
   - IMPORTANT: Do NOT use `try_move` if you plan to play the opponent's reply next, because `try_move` resets the board to the previous turn! Always use `play_move` to step through a sequence of moves.
   - STRICT TOOL FORMAT: When calling `play_move` or `try_move`, pass ONLY the 4-character square-to-square UCI coordinate string (e.g., `"d4b5"`, `"c3b5"`, `"e4d5"`). NEVER add piece letters (`N`, `B`, `R`, `Q`, `K`) or capture symbols (`x`, `-`, `+`) in tool arguments (for example, write `"d4b5"`, NEVER `"Nd4b5"`).
3. Immediately follow the opponent's punishment (`opponent_best_reply`) using `play_move` for at least 2 to 3 plies (half-moves) to see WHAT piece is actually captured, forked, pinned, or threatened.
4. Compare the board state before and after the sequence to identify which specific piece is lost, left undefended (hanging), or which key square is surrendered.

CRITICAL COMMUNICATION RULES:
1. NO ENGINE JARGON: Never mention engine evaluations, numeric evaluation scores (e.g., "+1.5", "-300"), "centipawns", "cp", or the words "engine" / "evaluation". (Chess square coordinates like c3, b5, e4 and move notation like c3b5, Nxd4, Bb5+ ARE required and encouraged).
2. NO VAGUE LITERARY FILLER: Ban vague phrases like "dramatically sacrifices control", "catastrophic disadvantage", "massive advantage in the flow of the game", or "makes a strong continuation".
3. ALWAYS NAME CONCRETE MOVES, PIECES, AND SQUARES (ESPECIALLY CAPTURES):
   - Always explicitly name the opponent's best reply (e.g., "Black replies with d7d5" or "Black plays Nxe4").
   - Whenever `play_move` or `try_move` returns a non-null `captured_piece`, you MUST explicitly state WHICH piece is captured and on WHICH square (e.g., "capturing the undefended white pawn on e4" or "winning your knight on b5").
   - Always name the specific chess concept or tactical motif: hanging piece (undefended piece), fork, pin, skewer, discovered attack, loss of tempo, weak square, back-rank threat, trapped piece, or center control.
4. EXAMPLES:
   - BAD (too vague/literary): "Moving the knight to b5 is a disaster because it sacrifices control and allows Black to play a strong continuation that wins material."
   - GOOD (concrete chess coaching): "Playing the knight from c3 to b5 is a blunder because it leaves your e4 pawn undefended and attacks nothing. Black immediately punishes this with Nxe4, winning a central pawn with tempo while threatening f2."
5. Keep your final answer concise (maximum 3-4 sentences), focused strictly on the concrete moves and chess concepts.
"""
LLM_MODEL = "gemma4:e4b"
MAX_TRIES = 20

def analyze_question(question: str, fen: str, stockfish_engine):
    tool_list = create_tools(stockfish_engine=stockfish_engine, fen_position=fen)
    tool_definitions = tool_list['tools']
    call_function = tool_list['call_function']

    messages = [
        {"role": "system", "content":CHESS_PROMPT},
        {"role": "user", "content": question.strip()}
    ]

    for try_count in range(MAX_TRIES + 1):
        final_call = try_count == MAX_TRIES

        if final_call:
            messages.append({
                "role": "user",
                "content": (
                    "You reach your tool usage limits. Come up with your best reponse using the already obtained results."
                    "don't invent any information and specify that your analysis is incomplete."
                )
            })

        response = ollama.chat(
            model = LLM_MODEL,
            messages = messages,
            tools=tool_definitions,
            options={'num_ctx': 16384},
            think=True
        )
        # if response.message.thinking: # TODO need to see how to make it accessible
        #     print("Thinking... ", '\n')

        tool_calls = response.message.tool_calls or []
        
        if tool_calls:
            if final_call:
                print('limit reached: No output.')
                break
        
            tool_call_msg = {
                "role": "assistant",
                "thinking": response.message.thinking,
                "tool_calls": response.message.tool_calls,
            }
            messages.append(tool_call_msg) # Prevents the agent from loop calling the same tool

            for tool in tool_calls:
                function_name = tool.function.name
                print(f"calling function {function_name}({tool.function.arguments})...")
                function_output = call_function(tool)
                tool_msg = {
                    "role": "tool",
                    "tool_name": function_name,
                    "content": f"function_output:{function_output}"
                }
                print('tool output:', tool_msg['content'])
                messages.append(tool_msg)
            continue
        
        content = getattr(response.message, "content", None)
        if content and str(content).strip():
            return response.message.content
        break
