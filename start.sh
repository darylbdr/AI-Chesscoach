#!/bin/bash
set -e

echo "Starting Ollama server in background..."
ollama serve &

echo "Waiting for Ollama to be ready..."
until curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; do
  sleep 1
done
echo "Ollama is ready."

echo "Starting AI Chess Coach server on port 8080..."
cd backend-coach
exec python server_prod.py
