#!/bin/bash

# JARVIS PRO - Başlat Scripti
# Tüm servisleri sırasıyla başlatır

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Sabitler
JARVIS_DIR="/opt/jarvis-pro"
VENV_PATH="$JARVIS_DIR/venv"
LOG_DIR="$JARVIS_DIR/logs"
PID_DIR="/tmp/jarvis-pids"

# PID dizini oluştur
mkdir -p $PID_DIR
mkdir -p $LOG_DIR

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════╗
║                                        ║
║         🤖 JARVIS PRO v1.0 🤖          ║
║                                        ║
║   J.A.R.V.I.S. - Artificial Reality   ║
║   Virtual Intelligent System           ║
║                                        ║
╚════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Sanal ortamı aktif et
echo -e "${YELLOW}[1/5] Sanal ortam aktif ediliyor...${NC}"
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}❌ Sanal ortam bulunamadı! setup.sh çalıştırın.${NC}"
    exit 1
fi
source $VENV_PATH/bin/activate

# Ollama kontrolü ve başlatılması
echo -e "${YELLOW}[2/5] Ollama servisi kontrol ediliyor...${NC}"
if command -v ollama &> /dev/null; then
    # Ollama'nın zaten çalışıp çalışmadığını kontrol et
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${YELLOW}   → Ollama başlatılıyor...${NC}"
        ollama serve > $LOG_DIR/ollama.log 2>&1 &
        OLLAMA_PID=$!
        echo $OLLAMA_PID > $PID_DIR/ollama.pid
        sleep 3
        echo -e "${GREEN}   ✅ Ollama başlatıldı (PID: $OLLAMA_PID)${NC}"
    else
        echo -e "${GREEN}   ✅ Ollama zaten çalışıyor${NC}"
    fi
else
    echo -e "${RED}   ❌ Ollama yüklü değil!${NC}"
    exit 1
fi

# Llama modelini kontrol et
echo -e "${YELLOW}[3/5] Llama2 modeli kontrol ediliyor...${NC}"
if ! ollama list 2>/dev/null | grep -q "llama2"; then
    echo -e "${YELLOW}   → Llama2 indiriliyor (ilk kez uzun sürer)...${NC}"
    ollama pull llama2
fi
echo -e "${GREEN}   ✅ Llama2 modeli hazır${NC}"

# Flask API sunucusunu başlat
echo -e "${YELLOW}[4/5] JARVIS API sunucusu başlatılıyor...${NC}"
cd $JARVIS_DIR
python app.py > $LOG_DIR/api.log 2>&1 &
API_PID=$!
echo $API_PID > $PID_DIR/api.pid
sleep 2

# API'nin çalışıp çalışmadığını kontrol et
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ API sunucusu başlatıldı (PID: $API_PID)${NC}"
else
    echo -e "${RED}   ❌ API sunucusu başlatılamadı!${NC}"
    echo -e "   📋 Logs: $LOG_DIR/api.log"
    exit 1
fi

# Sistem durumunu kontrol et
echo -e "${YELLOW}[5/5] Sistem durumu kontrol ediliyor...${NC}"
HEALTH=$(curl -s http://localhost:5000/api/health)
echo -e "${GREEN}   $HEALTH${NC}"

# Başarıyla başlatıldı
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ JARVIS PRO Başarıyla Başlatıldı! ✨${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Servis Bilgileri:${NC}"
echo "  • Frontend:  http://localhost:3000 (React UI)"
echo "  • API:       http://localhost:5000"
echo "  • WebSocket: ws://localhost:5000"
echo "  • Ollama:    http://localhost:11434"
echo ""
echo -e "${BLUE}📋 Log Dosyaları:${NC}"
echo "  • API:       $LOG_DIR/api.log"
echo "  • Ollama:    $LOG_DIR/ollama.log"
echo ""
echo -e "${BLUE}🛑 Durdurmak için:${NC}"
echo "  bash stop-jarvis.sh"
echo ""
echo -e "${BLUE}📝 Komut Örnekleri:${NC}"
echo "  curl -X POST http://localhost:5000/api/command -H 'Content-Type: application/json' -d '{\"text\":\"Cursor aç\"}'"
echo ""

# Ön plana getir
wait
