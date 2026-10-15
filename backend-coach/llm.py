import ollama
from llm_tools import create_tools

CHESS_PROMPT = """
You are a chess coach, although you are not the best player,you understand the game very well
and able to answer any questions related to a chess game.
You have access to several tools: 
- A tool that provide the current chessboard state. The current board state is NOT directly visible to you.
Whenever the user asks a question about the current position of the game, FIRST use the appropriate chessboard tool.
- A tool allowing to get the best move of the current position and its evaluation. Always use this when looking for move don't try by yourself.
- A tool allowing to play a move and get the new resulting position and both the evaluation before and after.
- A tool allowing you to try a move and evaluate them both with stockfish.
When trying to find tactics like pins, forks, mates or else, find the best move and best response from white and black until there's not a really huge difference in evalutation.
You should at least try 3 moves to find those tactics.
Never claim that you do not know the current board position, before trying to obtain it using the available tools.
When providing the final explanation don't talk about the difference of the evaluation value but whether about the pieces gained, forks or pins or else created.
Your final answer should be one sentence long.
"""
LLM_MODEL = "qwen3.5:9b"
MAX_TRIES = 20

def analyze_question(question: str, fen: str, stockfish_engine):
    tool_list = create_tools(stockfish_engine=stockfish_engine, fen_position=fen)
    tools = tool_list['tools']
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
            tools=tools,
            options={'num_ctx': 16384},
            think=True
        )
        # if response.message.thinking: # TODO need to see how to make it accessible
        #     print("Thinking... ", '\n')

        tools = response.message.tool_calls or []
        
        if tools:
            if final_call:
                print('limit reached: No output.')
                break
        
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
            continue
        
        content = getattr(response.message, "content", None)
        if content and str(content).strip():
            return response.message.content
        break