import os
import json
import subprocess
import requests
from typing import Optional, Dict, List
import logging
import time
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JarvisBrain:
    """JARVIS PRO - Ana entegrasyon motoru"""
    
    def __init__(self, config):
        self.config = config
        self.context = {}
        self.is_listening = False
        self.command_history = []
        
    # ==================== AÇMA KAPATMA ====================
    
    def open_cursor(self, file_path: str = None):
        """Cursor editörünü açar"""
        try:
            cmd = ['cursor']
            if file_path:
                cmd.append(file_path)
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            message = f"Cursor açıldı: {file_path}" if file_path else "Cursor açıldı"
            self._log_command("open_cursor", message)
            return {"status": "success", "message": message}
        except Exception as e:
            logger.error(f"Cursor açılamadı: {e}")
            return {"status": "error", "message": str(e)}
    
    def open_terminal(self, command: str = None):
        """Terminal açar ve komut çalıştırır"""
        try:
            if command:
                # GNOME Terminal için
                subprocess.Popen(['gnome-terminal', '--', 'bash', '-c', command])
                message = f"Terminal açıldı, komut çalıştırılıyor: {command}"
            else:
                subprocess.Popen(['gnome-terminal'])
                message = "Terminal açıldı"
            
            self._log_command("open_terminal", message)
            return {"status": "success", "message": message}
        except Exception as e:
            logger.error(f"Terminal açılamadı: {e}")
            return {"status": "error", "message": str(e)}
    
    def open_file_manager(self, path: str = None):
        """Dosya yöneticisini açar"""
        try:
            cmd = ['nautilus'] if path is None else ['nautilus', path]
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            message = f"Dosya yöneticisi açıldı: {path}" if path else "Dosya yöneticisi açıldı"
            self._log_command("open_file_manager", message)
            return {"status": "success", "message": message}
        except Exception as e:
            logger.error(f"Dosya yöneticisi açılamadı: {e}")
            return {"status": "error", "message": str(e)}
    
    def open_browser(self, url: str = None):
        """Web tarayıcısını açar"""
        try:
            if url:
                subprocess.Popen(['xdg-open', url])
                message = f"Tarayıcı açıldı: {url}"
            else:
                subprocess.Popen(['xdg-open', 'https://www.google.com'])
                message = "Tarayıcı açıldı"
            
            self._log_command("open_browser", message)
            return {"status": "success", "message": message}
        except Exception as e:
            logger.error(f"Tarayıcı açılamadı: {e}")
            return {"status": "error", "message": str(e)}
    
    # ==================== OPEN INTERPRETER ENTEGRASYON ====================
    
    def execute_with_open_interpreter(self, task: str):
        """Open Interpreter ile görev çalıştırır"""
        try:
            from interpreter import interpreter
            
            # Ollama'yı kullan
            interpreter.llm.model = f"ollama/llama2"
            interpreter.llm.api_base = self.config.OLLAMA_URL
            interpreter.offline = True
            
            # Görev çalıştır
            logger.info(f"🤖 Open Interpreter görev çalıştırılıyor: {task}")
            result = interpreter.chat(task)
            
            self._log_command("open_interpreter", f"Görev: {task}")
            return {
                "status": "success",
                "result": str(result),
                "executor": "open_interpreter",
                "task": task
            }
        except Exception as e:
            logger.error(f"Open Interpreter hatası: {e}")
            return {"status": "error", "message": str(e), "executor": "open_interpreter"}
    
    # ==================== WHISPER (STT) ====================
    
    def transcribe_audio(self, audio_file: str):
        """Ses dosyasını metne çevir"""
        try:
            import whisper
            logger.info(f"🎙️ Whisper transkripsiyon: {audio_file}")
            model = whisper.load_model(self.config.WHISPER_MODEL)
            result = model.transcribe(audio_file)
            
            self._log_command("transcribe_audio", f"Transkript: {result['text']}")
            return {
                "status": "success",
                "text": result['text'],
                "language": result.get('language', 'unknown')
            }
        except Exception as e:
            logger.error(f"Whisper hatası: {e}")
            return {"status": "error", "message": str(e)}
    
    # ==================== OLLAMA (LLM) ====================
    
    def query_ollama(self, prompt: str, context: List = None):
        """Ollama LLM'ye soru sorma"""
        try:
            payload = {
                "model": self.config.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "context": context or self.context.get('ollama_context', [])
            }
            
            logger.info(f"🧠 Ollama sorgusu: {prompt}")
            response = requests.post(
                f"{self.config.OLLAMA_URL}/api/generate",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # Context'i kaydet
                self.context['ollama_context'] = data.get('context', [])
                
                self._log_command("query_ollama", f"Sorgu: {prompt} -> Cevap: {data['response'][:100]}")
                return {
                    "status": "success",
                    "response": data['response'],
                    "context": data.get('context', [])
                }
            else:
                raise Exception(f"Ollama hatası: {response.text}")
                
        except Exception as e:
            logger.error(f"Ollama sorgusu hatası: {e}")
            return {"status": "error", "message": str(e)}
    
    # ==================== PIPER (TTS) ====================
    
    def synthesize_speech(self, text: str, output_file: str = "/tmp/jarvis_output.wav"):
        """Metni sese dönüştür"""
        try:
            logger.info(f"🔊 Piper TTS: {text[:50]}...")
            
            # Piper komutu
            cmd = f"echo '{text}' | piper --model {self.config.PIPER_VOICE} --output_file {output_file}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                self._log_command("synthesize_speech", f"Ses üretildi: {output_file}")
                return {
                    "status": "success",
                    "audio_file": output_file,
                    "message": "Ses üretildi"
                }
            else:
                raise Exception(result.stderr)
                
        except Exception as e:
            logger.error(f"Piper hatası: {e}")
            return {"status": "error", "message": str(e)}
    
    # ==================== AKILLI DISPATCHER ====================
    
    def process_command(self, text: str) -> Dict:
        """Komutları analiz edip uygun modüle yönlendir"""
        
        text_lower = text.lower()
        logger.info(f"📝 Komut işleniyor: {text}")
        
        # Cursor komutları
        if any(word in text_lower for word in ["cursor aç", "cursor açma", "editör aç", "kodu aç"]):
            # Dosya adını çıkar
            if "açma" in text_lower or "aç" in text_lower:
                parts = text_lower.split("aç")
                file_path = parts[-1].strip() if len(parts) > 1 else None
                return self.open_cursor(file_path)
            return self.open_cursor()
        
        elif any(word in text_lower for word in ["dosya düzenle", "düzenle", "kod düzenle"]):
            file_path = text.split("düzenle")[-1].strip()
            return self.open_cursor(file_path)
        
        # Terminal komutları
        elif any(word in text_lower for word in ["terminal aç", "terminal", "komut çalıştır", "bash"]):
            cmd = None
            for sep in ["terminal", "çalıştır", "komutu"]:
                if sep in text_lower:
                    cmd = text.split(sep)[-1].strip()
                    break
            return self.open_terminal(cmd if cmd else None)
        
        # Dosya Yöneticisi
        elif any(word in text_lower for word in ["dosya yöneticisi", "dosyalar", "klasör aç", "dizin"]):
            path = None
            for sep in ["aç", "açma"]:
                if sep in text_lower:
                    path = text.split(sep)[-1].strip()
                    break
            return self.open_file_manager(path)
        
        # Browser
        elif any(word in text_lower for word in ["browser", "tarayıcı", "web", "google", "sitesi aç"]):
            url = None
            if "sitesi" in text_lower or ".com" in text_lower or "http" in text_lower:
                parts = text.split()
                for part in parts:
                    if ".com" in part or "http" in part:
                        url = part
                        break
            return self.open_browser(url)
        
        # Kod yürütme (Open Interpreter)
        elif any(word in text_lower for word in ["yap", "çalıştır", "kod yaz", "programla", "script", "python", "javascript", "yapı"]):
            return self.execute_with_open_interpreter(text)
        
        # Normal soru (LLM)
        else:
            return self.query_ollama(text)
    
    # ==================== FULL WORKFLOW ====================
    
    def jarvis_workflow(self, audio_file: str) -> Dict:
        """
        Tam JARVIS Workflow:
        Audio → Whisper → LLM → Action → Piper → Audio
        """
        
        logger.info("=" * 50)
        logger.info("📢 JARVIS WORKFLOW BAŞLADI")
        logger.info("=" * 50)
        
        # 1. Ses → Metin
        logger.info("🎙️  [1/4] Transkripsiyon yapılıyor...")
        transcription = self.transcribe_audio(audio_file)
        
        if transcription['status'] != 'success':
            return transcription
        
        user_text = transcription['text']
        logger.info(f"👤 Kullanıcı: {user_text}")
        
        # 2. Komut İşleme
        logger.info("🧠 [2/4] Komut işleniyor...")
        result = self.process_command(user_text)
        logger.info(f"✅ Sonuç: {result['status']}")
        
        # 3. Yanıt Oluşturma
        if result['status'] == 'success':
            response_text = self._format_response(result)
        else:
            response_text = f"Hata oluştu: {result.get('message', 'Bilinmeyen hata')}"
        
        # 4. Metin → Ses
        logger.info("🔊 [3/4] Ses üretiliyor...")
        audio_result = self.synthesize_speech(response_text)
        
        logger.info("=" * 50)
        logger.info("✨ WORKFLOW TAMAMLANDI")
        logger.info("=" * 50)
        
        return {
            "status": "success",
            "user_input": user_text,
            "command_result": result,
            "response_text": response_text,
            "audio_file": audio_result.get('audio_file'),
            "workflow_duration": datetime.now().isoformat()
        }
    
    def _format_response(self, result: Dict) -> str:
        """Sonuçları metne dönüştür"""
        if 'response' in result:
            return result['response'][:500]  # Kısalt
        elif 'message' in result:
            return result['message']
        elif 'result' in result:
            return str(result['result'])[:500]
        else:
            return "İşlem tamamlandı."
    
    def _log_command(self, command_type: str, details: str):
        """Komut geçmişini kaydet"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": command_type,
            "details": details
        }
        self.command_history.append(log_entry)
        logger.info(f"📋 [{command_type}] {details}")
    
    # ==================== YARDIMCI FONKSIYONLAR ====================
    
    def get_system_status(self) -> Dict:
        """Sistem durumunu kontrol et"""
        status = {
            "ollama": self._check_ollama(),
            "whisper": "ready",
            "piper": "ready",
            "cursor": self._check_cursor(),
            "terminal": "ready",
            "timestamp": datetime.now().isoformat()
        }
        return status
    
    def _check_ollama(self) -> str:
        """Ollama servisini kontrol et"""
        try:
            response = requests.get(f"{self.config.OLLAMA_URL}/api/tags", timeout=2)
            return "online" if response.status_code == 200 else "offline"
        except:
            return "offline"
    
    def _check_cursor(self) -> str:
        """Cursor kurulu mu kontrol et"""
        try:
            subprocess.run(['which', 'cursor'], capture_output=True, check=True)
            return "installed"
        except:
            return "not_installed"
    
    def get_command_history(self, limit: int = 10) -> List[Dict]:
        """Son komutları getir"""
        return self.command_history[-limit:]
    
    def clear_history(self):
        """Geçmişi temizle"""
        self.command_history = []
        logger.info("📋 Komut geçmişi temizlendi")
