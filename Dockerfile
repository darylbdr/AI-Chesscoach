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

# Create non-root user required by Hugging Face Spaces (uid 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH="/home/user/.local/bin:$PATH" \
    STOCKFISH_PATH="/usr/games/stockfish" \
    PORT=7860

WORKDIR /home/user/app

COPY --chown=user backend-coach/requirements.txt ./backend-coach/requirements.txt
RUN pip install --no-cache-dir --upgrade -r ./backend-coach/requirements.txt

COPY --chown=user backend-coach ./backend-coach
COPY --chown=user --from=frontend-build /app/dist ./dist
COPY --chown=user start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 7860

CMD ["./start.sh"]
