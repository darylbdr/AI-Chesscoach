#!/bin/bash
set -e

echo "Starting Ollama server in background..."
ollama serve &

echo "Starting AI Chess Coach server..."
cd backend-coach
exec python server_prod.py
