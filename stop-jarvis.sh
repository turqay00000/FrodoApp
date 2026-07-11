#!/bin/bash

# JARVIS PRO - Durdurma Scripti
# Tüm servisleri düzgün bir şekilde durdurur

PID_DIR="/tmp/jarvis-pids"
LOG_DIR="/opt/jarvis-pro/logs"

echo "🛑 JARVIS PRO Kapatılıyor..."
echo "================================"

# API sunucusunu durdur
if [ -f "$PID_DIR/api.pid" ]; then
    API_PID=$(cat $PID_DIR/api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        echo "Stopping API Server (PID: $API_PID)..."
        kill $API_PID
        sleep 1
        rm $PID_DIR/api.pid
        echo "✅ API Server durdu"
    fi
fi

# Ollama'yı durdur
if [ -f "$PID_DIR/ollama.pid" ]; then
    OLLAMA_PID=$(cat $PID_DIR/ollama.pid)
    if kill -0 $OLLAMA_PID 2>/dev/null; then
        echo "Stopping Ollama (PID: $OLLAMA_PID)..."
        kill $OLLAMA_PID
        sleep 1
        rm $PID_DIR/ollama.pid
        echo "✅ Ollama durdu"
    fi
fi

echo ""
echo "✨ JARVIS PRO kapatıldı"
echo "Logs: $LOG_DIR/"
