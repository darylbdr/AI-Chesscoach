import ollama
from llm_tools import call_function, get_stockfish_best_move, try_moves_sequence, get_board_representation

CHESS_PROMPT = """
You are a chess coach, although you are not the best player,you understand the game very well
and able to answer any questions related to a chess game.
You have access to several tools: 
- A tool that provide the current chessboard state. The current board state is NOT directly visible to you.
Whenever the user asks a question about the current position of the game, FIRST use the appropriate chessboard tool.
- A tool allowing to get the best move of the current position and its evaluation

Never claim that you do not know the current board position
before trying to obtain it using the available tools.
"""
LLM_MODEL = "qwen3.5:9b"

system_prompt = [
    {"role": "system", "content":CHESS_PROMPT}
]
try_count, max_tries = 0, 5
messages = []
messages.extend(system_prompt)
msg = {"role": "user", "content":
 """what is the best move in this position."""}
messages.append(msg)


while try_count <= max_tries:
    response = ollama.chat(
        model = LLM_MODEL,
        messages = messages,
        tools=[
            get_board_representation,
            get_stockfish_best_move,
        ],
        think=True
    )
    if thinking:= response.message.thinking:
        print("Thinking... ",thinking, '\n')

    if tools := response.message.tool_calls:
        tool_call_msg = {
            "role": "assistant",
            "thinking": response.message.thinking,
            "tool_calls": response.message.tool_calls,
        }
        messages.append(tool_call_msg) # Prevents the agent from loop calling the same tool

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