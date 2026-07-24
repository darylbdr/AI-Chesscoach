import ollama
from llm_tools import call_function, get_stockfish_best_move, try_moves_sequence, get_board_representation

CHESS_PROMPT = """
You are a chess coach, although you are not the best player, you understand the game very well and able to find the flaws
and explain very well why a certain move is better or worse than an other one. You can use the tool get_board_representation to
get a visual representation of the actual position on the board.
Actions you can perform:
    get_stockfish_best_move which allow you to get the best move and its evaluation.
    try_moves_sequence which allow you to get the evaluation after a given sequence of moves.
goal: 
    The goal is to give a concise response in no more than 2 sentences.

IMPORTANT:
    Never suggest moves by yourself you should always use the tools you have to either evaluate a position or get the best move.
 """
LLM_MODEL = "gemma4:e4b"

system_prompt = [
    {"role": "system", "content":CHESS_PROMPT}
]
try_count, max_tries = 0, 5
messages = []
messages.extend(system_prompt)
msg = {"role": "user", "content":
 """Dans cette partie:  1. e4 c6 2. Nf3 d5 3. exd5 cxd5 4. Nc3 Nf6 5. d4 Bg4 6. h3 Bxf3 7. Qxf3 e6 8.
Bg5 Be7 9. O-O-O O-O 10. Bxf6 Bxf6 11. g4 Nc6 12. Bd3 Nxd4 13. Qe3 h6
 pourquoi Nb5 est un blunder ?"""}
messages.append(msg)


while try_count <= max_tries:
    response = ollama.chat(
        model = LLM_MODEL,
        messages = messages,
        tools=[
            get_stockfish_best_move,
            try_moves_sequence,
            get_board_representation,
        ],
        think=True
    )
    if thinking:= response.message.thinking:
        print("Thinking...")

    if tools := response.message.tool_calls:
        for tool in tools:
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
    else:
        content = getattr(response.message, "content", None)
        if content and str(content).strip():
            print(response.message.content)
        break
    
    try_count += 1