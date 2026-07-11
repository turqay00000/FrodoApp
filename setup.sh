#!/bin/bash

# JARVIS PRO - Linux Kurulum Scripti
# Tüm bileşenleri otomatik kurar

set -e

echo "🤖 JARVIS PRO - Kurulum Başlıyor..."
echo "================================"

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Sistem Paketleri
echo -e "${YELLOW}[1/8] Sistem paketleri yükleniyor...${NC}"
sudo apt-get update
sudo apt-get install -y \
    python3.11 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    ffmpeg \
    portaudio19-dev \
    alsa-utils \
    pulseaudio \
    sox

# 2. Python Sanal Ortam
echo -e "${YELLOW}[2/8] Python sanal ortamı oluşturuluyor...${NC}"
mkdir -p /opt/jarvis-pro
python3 -m venv /opt/jarvis-pro/venv
source /opt/jarvis-pro/venv/bin/activate

# 3. Python Bağımlılıkları
echo -e "${YELLOW}[3/8] Python paketleri yükleniyor...${NC}"
pip install --upgrade pip setuptools wheel
pip install \
    open-interpreter \
    piper-tts \
    openai-whisper \
    requests \
    python-dotenv \
    flask \
    flask-cors \
    flask-socketio \
    python-socketio \
    numpy \
    scipy \
    pyaudio \
    pydub

# 4. Ollama Kurulu mu Kontrol Et
echo -e "${YELLOW}[4/8] Ollama kontrol ediliyor...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama yükleniyor...${NC}"
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# 5. Llama Model İndir
echo -e "${YELLOW}[5/8] Llama modeli indiriliyor (ilk kez uzun sürer)...${NC}"
ollama pull llama2 || echo "Model zaten yüklü"

# 6. Cursor Kurulu mu Kontrol Et
echo -e "${YELLOW}[6/8] Cursor editörü kontrol ediliyor...${NC}"
if ! command -v cursor &> /dev/null; then
    echo -e "${YELLOW}Cursor yükleniyor...${NC}"
    mkdir -p ~/.local/bin
    cd ~/.local/bin
    wget https://download.cursor.sh/linux/appImage/x64 -O cursor 2>/dev/null || echo "Cursor download başarısız, manuel indir"
    chmod +x cursor
    cd -
fi

# 7. Konfigürasyon Dosyaları
echo -e "${YELLOW}[7/8] Konfigürasyon dosyaları oluşturuluyor...${NC}"
mkdir -p /opt/jarvis-pro/{config,logs,scripts,core,api}

# 8. JARVIS Ana Servisi
echo -e "${YELLOW}[8/8] JARVIS servisi ayarlanıyor...${NC}"
cat > /opt/jarvis-pro/config/.env << 'EOF'
# JARVIS PRO Configuration
JARVIS_API_KEY=your_api_key_here
JARVIS_HOST=0.0.0.0
JARVIS_PORT=5000
OLLAMA_URL=http://localhost:11434
WHISPER_MODEL=base
PIPER_VOICE=en_US-ryan-medium
DEBUG=true
EOF

echo -e "${GREEN}✅ Kurulum tamamlandı!${NC}"
echo ""
echo -e "${GREEN}Sonraki Adımlar:${NC}"
echo "1. source /opt/jarvis-pro/venv/bin/activate"
echo "2. cd /opt/jarvis-pro"
echo "3. bash start-jarvis.sh"
