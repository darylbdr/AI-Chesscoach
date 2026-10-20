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
CRITICAL OUTPUT RULES:
1. STRICTLY FORBIDDEN: Never mention numbers, scores, symbols (+, -), "centipawns", "cp", or the word "evaluation" in your final response.
2. TRANSLATE SCORES INTO CONCEPTS: Use the tool's evaluation strictly as an internal compass, then translate it into qualitative chess terms:
   - Small change -> "improves position", "controls space", "develops a piece"
   - Medium change -> "wins a pawn", "creates a strong attack"
   - Huge change -> "wins a piece", "blunders the Queen", "forces checkmate"
3. EXAMPLE:
   - BAD: "Playing Nf3 is best because the evaluation goes from +0.2 to +1.8."
   - GOOD: "Playing Nf3 is the best move because it develops your knight toward the center and prepares a fork on the enemy king and rook."
4. Keep your final response under 3 sentences.
"""
LLM_MODEL = "qwen3.5:9b"
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