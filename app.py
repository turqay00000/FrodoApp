from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
import threading
import io

# Load environment variables
load_dotenv()

# Import JARVIS Brain
import sys
sys.path.insert(0, os.path.dirname(__file__))
from jarvis_brain import JarvisBrain

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# JARVIS Config
class Config:
    FLASK_HOST = os.getenv('JARVIS_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('JARVIS_PORT', 5000))
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    OLLAMA_MODEL = 'llama2'
    WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')
    PIPER_VOICE = os.getenv('PIPER_VOICE', 'en_US-ryan-medium')

config = Config()
jarvis = JarvisBrain(config)

# Store connected clients
connected_clients = {}

# ==================== REST API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health():
    """Sistem sağlık kontrolü"""
    status = jarvis.get_system_status()
    return jsonify({
        "status": "alive",
        "jarvis": "online",
        "services": status,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/command', methods=['POST'])
def execute_command():
    """Komut çalıştırma (Text → Action)"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"status": "error", "message": "Text gerekli"}), 400
        
        logger.info(f"🎯 Komut alındı: {text}")
        result = jarvis.process_command(text)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Komut çalıştırma hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """Ses dosyasını transkripsiyon yap (Audio → Text)"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "Audio file required"}), 400
        
        file = request.files['audio']
        temp_path = '/tmp/jarvis_input.wav'
        file.save(temp_path)
        
        logger.info("🎙️ Transkripsiyon başladı...")
        result = jarvis.transcribe_audio(temp_path)
        
        # Geçici dosyayı sil
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Transkripsiyon hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/speak', methods=['POST'])
def speak():
    """Metni sese dönüştür (Text → Audio)"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Text required"}), 400
        
        logger.info(f"🔊 TTS başladı: {text[:50]}...")
        result = jarvis.synthesize_speech(text)
        
        if result['status'] == 'success' and os.path.exists(result['audio_file']):
            return send_file(
                result['audio_file'],
                mimetype='audio/wav',
                as_attachment=True,
                download_name='jarvis_response.wav'
            )
        else:
            return jsonify(result), 500
    except Exception as e:
        logger.error(f"TTS hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/workflow', methods=['POST'])
def workflow():
    """Tam JARVIS Workflow: Audio → Text → Action → Response → Audio"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "Audio file required"}), 400
        
        file = request.files['audio']
        temp_path = '/tmp/jarvis_input.wav'
        file.save(temp_path)
        
        logger.info("🤖 Tam workflow başladı...")
        result = jarvis.jarvis_workflow(temp_path)
        
        # Geçici dosyayı sil
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Workflow hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/ollama/query', methods=['POST'])
def ollama_query():
    """Doğrudan Ollama sorgulama"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        context = data.get('context', None)
        
        if not prompt:
            return jsonify({"error": "Prompt required"}), 400
        
        logger.info(f"🧠 Ollama sorgusu: {prompt[:50]}...")
        result = jarvis.query_ollama(prompt, context)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Ollama sorgusu hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/cursor/open', methods=['POST'])
def cursor_open():
    """Cursor editörü aç"""
    try:
        data = request.json
        file_path = data.get('file_path', None)
        
        logger.info(f"📝 Cursor açılıyor: {file_path}")
        result = jarvis.open_cursor(file_path)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Cursor açma hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/terminal/exec', methods=['POST'])
def terminal_exec():
    """Terminal komut çalıştır"""
    try:
        data = request.json
        command = data.get('command', '')
        
        if not command:
            return jsonify({"error": "Command required"}), 400
        
        logger.info(f"💻 Terminal komutu: {command}")
        result = jarvis.open_terminal(command)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Terminal komutu hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/interpreter/exec', methods=['POST'])
def interpreter_exec():
    """Open Interpreter ile kod çalıştır"""
    try:
        data = request.json
        task = data.get('task', '')
        
        if not task:
            return jsonify({"error": "Task required"}), 400
        
        logger.info(f"⚙️ Open Interpreter: {task[:50]}...")
        result = jarvis.execute_with_open_interpreter(task)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Open Interpreter hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Komut geçmişini getir"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = jarvis.get_command_history(limit)
        return jsonify({"status": "success", "history": history})
    except Exception as e:
        logger.error(f"Geçmiş alıma hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """Geçmişi temizle"""
    try:
        jarvis.clear_history()
        return jsonify({"status": "success", "message": "Geçmiş temizlendi"})
    except Exception as e:
        logger.error(f"Geçmiş temizleme hatası: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==================== WEBSOCKET EVENTS ====================

@socketio.on('connect')
def handle_connect():
    """WebSocket bağlantısı"""
    client_id = request.sid
    connected_clients[client_id] = {
        'connected_at': datetime.now().isoformat(),
        'status': 'connected'
    }
    logger.info(f"✅ İstemci bağlandı: {client_id}")
    emit('response', {
        'type': 'connection',
        'message': 'JARVIS PRO bağlandı',
        'client_id': client_id,
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('disconnect')
def handle_disconnect():
    """WebSocket bağlantısı kesildi"""
    client_id = request.sid
    if client_id in connected_clients:
        del connected_clients[client_id]
    logger.info(f"❌ İstemci bağlantısı kesildi: {client_id}")

@socketio.on('command')
def handle_command(data):
    """WebSocket üzerinden komut"""
    try:
        text = data.get('text', '')
        client_id = request.sid
        
        logger.info(f"📨 WebSocket komut: {text} (Client: {client_id})")
        result = jarvis.process_command(text)
        
        emit('response', {
            'type': 'command_result',
            'data': result,
            'timestamp': datetime.now().isoformat()
        }, broadcast=True)
    except Exception as e:
        logger.error(f"WebSocket komut hatası: {e}")
        emit('error', {'message': str(e)})

@socketio.on('query')
def handle_query(data):
    """WebSocket üzerinden LLM sorgusu"""
    try:
        prompt = data.get('prompt', '')
        context = data.get('context', None)
        client_id = request.sid
        
        logger.info(f"📨 WebSocket sorgu: {prompt[:50]}... (Client: {client_id})")
        result = jarvis.query_ollama(prompt, context)
        
        emit('response', {
            'type': 'query_result',
            'data': result,
            'timestamp': datetime.now().isoformat()
        }, broadcast=True)
    except Exception as e:
        logger.error(f"WebSocket sorgu hatası: {e}")
        emit('error', {'message': str(e)})

@socketio.on('transcribe_stream')
def handle_transcribe_stream(data):
    """Gerçek zamanlı ses akışı transkripsiyon"""
    try:
        audio_data = data.get('audio', '')
        client_id = request.sid
        
        # Base64 decode et ve dosyaya kaydet
        import base64
        audio_bytes = base64.b64decode(audio_data)
        temp_file = f'/tmp/jarvis_stream_{client_id}.wav'
        
        with open(temp_file, 'wb') as f:
            f.write(audio_bytes)
        
        result = jarvis.transcribe_audio(temp_file)
        
        emit('transcription', {
            'text': result.get('text', ''),
            'timestamp': datetime.now().isoformat()
        })
        
        # Dosyayı sil
        if os.path.exists(temp_file):
            os.remove(temp_file)
    except Exception as e:
        logger.error(f"Transkripsiyon stream hatası: {e}")
        emit('error', {'message': str(e)})

@socketio.on('tts_request')
def handle_tts_request(data):
    """WebSocket üzerinden TTS isteği"""
    try:
        text = data.get('text', '')
        client_id = request.sid
        
        logger.info(f"📨 WebSocket TTS: {text[:50]}... (Client: {client_id})")
        result = jarvis.synthesize_speech(text)
        
        if result['status'] == 'success':
            with open(result['audio_file'], 'rb') as f:
                audio_data = f.read()
            
            import base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            emit('audio', {
                'data': audio_b64,
                'timestamp': datetime.now().isoformat()
            })
        else:
            emit('error', {'message': result.get('message', 'TTS hatası')})
    except Exception as e:
        logger.error(f"TTS stream hatası: {e}")
        emit('error', {'message': str(e)})

@socketio.on('status')
def handle_status():
    """Sistem durumunu sorgulanması"""
    try:
        status = jarvis.get_system_status()
        emit('status', {
            'status': status,
            'connected_clients': len(connected_clients),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Durum sorgusu hatası: {e}")
        emit('error', {'message': str(e)})

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint bulunamadı"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 hatası: {error}")
    return jsonify({"status": "error", "message": "Server hatası"}), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("🤖 JARVIS PRO API Sunucusu Başlıyor...")
    logger.info("=" * 50)
    logger.info(f"Host: {config.FLASK_HOST}")
    logger.info(f"Port: {config.FLASK_PORT}")
    logger.info(f"Ollama URL: {config.OLLAMA_URL}")
    logger.info("=" * 50)
    
    socketio.run(
        app,
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=True,
        allow_unsafe_werkzeug=True
    )
