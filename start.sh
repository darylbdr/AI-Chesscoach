#!/bin/bash
set -e

echo "Starting Ollama server in background..."
ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!

echo "Waiting for Ollama to be ready..."
for i in $(seq 1 120); do
  if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "Ollama is ready after ${i}s."
    break
  fi
  if ! kill -0 $OLLAMA_PID 2>/dev/null; then
    echo "Ollama crashed during startup. Logs:"
    cat /tmp/ollama.log
    exit 1
  fi
  sleep 1
done

echo "Available models:"
ollama list || true

echo "Preloading gemma4:12b into GPU VRAM..."
curl -s http://127.0.0.1:11434/api/generate -d '{"model": "gemma4:12b", "keep_alive": -1}' >/dev/null 2>&1 &

# Stream Ollama logs to the container output
tail -f /tmp/ollama.log &

echo "Starting AI Chess Coach server..."
cd backend-coach
exec python server_prod.py
