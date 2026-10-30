# Stage 1: Build React Frontend
FROM node:22-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime (Python + Stockfish + Ollama + React dist)
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    zstd \
    stockfish \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

ENV STOCKFISH_PATH="/usr/games/stockfish" \
    PORT=8080

WORKDIR /app

COPY backend-coach/requirements.txt ./backend-coach/requirements.txt
RUN pip install --no-cache-dir --upgrade -r ./backend-coach/requirements.txt

# Pre-download gemma4:e4b during build
RUN ollama serve & \
    until curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; do sleep 1; done && \
    ollama pull gemma4:e4b

COPY backend-coach ./backend-coach
COPY --from=frontend-build /app/dist ./dist
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8080

CMD ["./start.sh"]
