# 🤖 JARVIS PRO - AI Assistant System

> **J.A.R.V.I.S.** - *Artificial Reality Virtual Intelligent System*

Bir ses komutu ile bilgisayarınızı kontrol eden, Open Interpreter ile kod çalıştırabilen, Cursor editörü açabilen ve doğal dil işleme yapan tam entegre bir yapay zeka asistanı.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)

---

## 🎯 Sistem Mimarisi

```
                 JARVIS PRO v1.0
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   WebSocket       REST API       gRPC
    (Real-time)    (5000)         (Soon)
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │   JARVIS BRAIN CORE       │
        │  (jarvis_brain.py)        │
        └─────────────┬─────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
  WHISPER          OLLAMA             PIPER
  (STT)         (LLM Brain)           (TTS)
  Audio→Text    Llama2 Model      Text→Audio
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
 CURSOR          TERMINAL           BROWSER
(Editor)      (Commands)         (xdg-open)
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
          Open Interpreter
          (Code Execution)
```

---

## ✨ Özellikler

### 🎤 Ses Kontrolü
- **Whisper** ile doğal dilde ses komutları anlama
- **Piper** ile insan benzeri ses yanıtları oluşturma
- Gerçek zamanlı transkripsiyon

### 🧠 AI/LLM
- **Ollama** ve **Llama2** ile çevrimdışı LLM işlemleri
- Bağlamsal konuşma geçmişi
- Türkçe ve İngilizce dil desteği

### 💻 Sistem Entegrasyonu
- **Cursor** editörü açma ve dosya düzenleme
- **Terminal** komutları çalıştırma
- **Open Interpreter** ile Python/JavaScript kodu yürütme
- **Dosya Yöneticisi** ve **Web Tarayıcısı** kontrolü

### 🔌 Bağlantı Seçenekleri
- REST API (tüm işlemler için)
- WebSocket (gerçek zamanlı iletişim)
- Python/JavaScript SDK'lar

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Linux (Ubuntu 20.04+)
- Python 3.11+
- 4GB+ RAM (Ollama için)
- 10GB+ Disk (Model + Sistem)

### 1. Kurulum

```bash
# Repository'i klonla
git clone https://github.com/turqay00000/FrodoApp.git
cd FrodoApp

# Setup scriptini çalıştır (tüm bağımlılıkları kurar)
bash setup.sh
```

### 2. JARVIS'i Başlat

```bash
# Sanal ortamı aktif et
source /opt/jarvis-pro/venv/bin/activate

# Başlat
bash start-jarvis.sh
```

Sistem otomatik olarak:
- ✅ Ollama'yı başlatacak
- ✅ Llama2 modelini kontrol edecek
- ✅ Flask API sunucusunu başlatacak
- ✅ WebSocket bağlantısını açacak

### 3. Test Et

```bash
bash test-jarvis.sh
```

### 4. JARVIS'i Kullan

```bash
# REST API ile komut gönder
curl -X POST http://localhost:5000/api/command \
  -H "Content-Type: application/json" \
  -d '{"text":"Cursor aç"}'

# Python ile
python3 << 'EOF'
import requests
response = requests.post('http://localhost:5000/api/command', 
    json={'text': 'Merhaba'})
print(response.json())
EOF
```

---

## 📋 Komut Örnekleri

### Editör Komutları
```
"Cursor aç"                    → Cursor editörü açılır
"main.py düzenle"             → main.py dosyası Cursor'da açılır
"Dosya yöneticisi aç"         → Nautilus açılır
```

### Terminal Komutları
```
"Terminal aç"                 → Yeni terminal penceresi açılır
"Terminal npm start"          → npm start komutu çalıştırılır
"Terminal git status"         → git status komutu çalıştırılır
```

### Kod Yürütme
```
"Python scripti yaz"          → Open Interpreter başlatılır
"JavaScript kodu çalıştır"    → Node.js kodu çalıştırılır
"Bu dosyayı optimize et"      → Open Interpreter kodu analiz eder
```

### AI Sorguları
```
"Merhaba"                     → LLM ile konuşma başlatılır
"Bugün hangi gün?"            → Ollama cevap verir
"Python öğret"                → Ollama eğitim konusu öğretir
```

---

## 🔌 API Endpoints

### REST API

#### Health Check
```bash
GET /api/health
```
Sistem durumunu kontrol et.

#### Komut Çalıştırma
```bash
POST /api/command
Content-Type: application/json

{
  "text": "Cursor aç"
}
```

#### Transkripsiyon (Audio → Text)
```bash
POST /api/transcribe
Content-Type: multipart/form-data

audio=@recording.wav
```

#### Text-to-Speech
```bash
POST /api/speak
Content-Type: application/json

{
  "text": "Merhaba"
}
```

#### Tam Workflow
```bash
POST /api/workflow
Content-Type: multipart/form-data

audio=@recording.wav
```
Ses → Metin → İşlem → Yanıt → Ses

#### Ollama Sorgusu
```bash
POST /api/ollama/query
Content-Type: application/json

{
  "prompt": "Bugün hava durumu ne?",
  "context": []
}
```

#### Open Interpreter
```bash
POST /api/interpreter/exec
Content-Type: application/json

{
  "task": "Python scriptini yaz"
}
```

### WebSocket Events

```python
import socketio

sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('Connected')
    # Komut gönder
    sio.emit('command', {'text': 'Merhaba'})

@sio.on('response')
def on_response(data):
    print('Response:', data)

sio.connect('http://localhost:5000')
sio.wait()
```

---

## 📁 Proje Yapısı

```
FrodoApp/
├── setup.sh                 # Kurulum scripti
├── start-jarvis.sh          # Başlat scripti
├── stop-jarvis.sh           # Durdur scripti
├── test-jarvis.sh           # Test scripti
├── app.py                   # Flask API sunucusu
├── jarvis_brain.py          # Ana entegrasyon motoru
├── requirements.txt         # Python bağımlılıkları
├── .env.example             # Ortam değişkenleri şablonu
├── README.md                # Bu dosya
└── logs/
    ├── api.log              # API logları
    └── ollama.log           # Ollama logları
```

---

## ⚙️ Konfigürasyon

### .env Dosyası

```bash
# setup.sh çalıştıktan sonra
cp .env.example .env
nano .env
```

**Önemli Değişkenler:**

```env
# Flask API
JARVIS_HOST=0.0.0.0
JARVIS_PORT=5000

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Whisper
WHISPER_MODEL=base

# Piper
PIPER_VOICE=en_US-ryan-medium

# Debug
DEBUG=true
```

---

## 🔍 Troubleshooting

### Ollama Bağlantı Hatası
```bash
# Ollama'nın çalışıp çalışmadığını kontrol et
curl http://localhost:11434/api/tags

# Manuel olarak başlat
ollama serve

# Model indir
ollama pull llama2
```

### API Sunucusu Başlamıyor
```bash
# Log dosyasını kontrol et
tail -f /opt/jarvis-pro/logs/api.log

# Port değiştir
JARVIS_PORT=5001 python app.py
```

### Whisper Modeli Hatası
```bash
# Model indir
python -m whisper --model base
```

### Cursor Bulunamadı
```bash
# Cursor'u kur
curl -L https://download.cursor.sh/linux/appImage/x64 -o ~/.local/bin/cursor
chmod +x ~/.local/bin/cursor
```

---

## 📊 Sistem Gereksinimleri

| Bileşen | Gereksinim |
|---------|-----------|
| **CPU** | 2+ cores (Ollama için 4+ tavsiye) |
| **RAM** | 4GB minimum, 8GB+ tavsiye |
| **Disk** | 15GB+ (Model + OS) |
| **GPU** | Opsiyonel (CUDA/ROCm daha hızlı) |
| **Python** | 3.11+ |
| **Linux** | Ubuntu 20.04+ veya equivalent |

---

## 🔒 Güvenlik

- `.env` dosyasını asla commit etme
- Secret keys'i güçlü yap
- Production'da `DEBUG=false` yap
- CORS ayarlarını sınırla
- API key'ler kullan

---

## 📚 Kaynaklar

- [Ollama Documentation](https://ollama.ai)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Open Interpreter](https://github.com/KillianLucas/open-interpreter)
- [Flask Documentation](https://flask.palletsprojects.com)

---

## 🤝 Katkı

Katkılarınız hoşlanır! Lütfen:

1. Fork yap
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit yap (`git commit -m 'Add amazing feature'`)
4. Push yap (`git push origin feature/amazing-feature`)
5. Pull Request aç

---

## 📄 Lisans

Bu proje MIT Lisansı altında yayınlanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👤 Yazar

**turqay00000**
- GitHub: [@turqay00000](https://github.com/turqay00000)
- Email: turqayismayilov28@gmail.com

---

## 🙏 Teşekkürler

- Ollama ve Llama2 ekibi
- OpenAI Whisper
- Piper TTS geliştiricileri
- Open Interpreter topluluğu

---

<div align="center">

**Made with ❤️ for AI Enthusiasts**

⭐ Star bırak | 🐛 Hata bildir | 💡 Öner

</div>
