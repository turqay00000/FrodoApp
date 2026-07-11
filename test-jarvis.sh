#!/bin/bash

# JARVIS PRO - Kontrol ve Test Scripti
# API'nin düzgün çalışıp çalışmadığını test eder

BASE_URL="http://localhost:5000"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧪 JARVIS PRO API Test Suite${NC}"
echo "================================"
echo ""

# 1. Health Check
echo -e "${YELLOW}[1/6] Health Check...${NC}"
HEALTH=$(curl -s -X GET $BASE_URL/api/health)
if echo $HEALTH | grep -q "alive"; then
    echo -e "${GREEN}✅ API alive${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}❌ API down${NC}"
    exit 1
fi
echo ""

# 2. Cursor Test
echo -e "${YELLOW}[2/6] Cursor Test...${NC}"
CURSOR=$(curl -s -X POST $BASE_URL/api/cursor/open \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Response: $CURSOR"
echo ""

# 3. Command Test
echo -e "${YELLOW}[3/6] Command Test...${NC}"
COMMAND=$(curl -s -X POST $BASE_URL/api/command \
  -H "Content-Type: application/json" \
  -d '{"text":"Merhaba"}')
echo "Response: $COMMAND"
echo ""

# 4. Ollama Query Test
echo -e "${YELLOW}[4/6] Ollama Query Test...${NC}"
QUERY=$(curl -s -X POST $BASE_URL/api/ollama/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Bugün hangi gün?"}')
echo "Response: $QUERY"
echo ""

# 5. TTS Test
echo -e "${YELLOW}[5/6] Text-to-Speech Test...${NC}"
TTS=$(curl -s -X POST $BASE_URL/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Merhaba dünya"}' \
  -o /tmp/jarvis_test.wav)
if [ -f /tmp/jarvis_test.wav ]; then
    echo -e "${GREEN}✅ Audio generated: /tmp/jarvis_test.wav${NC}"
else
    echo -e "${RED}❌ Audio generation failed${NC}"
fi
echo ""

# 6. History Test
echo -e "${YELLOW}[6/6] History Test...${NC}"
HISTORY=$(curl -s -X GET $BASE_URL/api/history?limit=5)
echo "Response: $HISTORY"
echo ""

echo -e "${GREEN}✨ Test Suite Completed!${NC}"
