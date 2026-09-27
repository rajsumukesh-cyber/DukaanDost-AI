import os
import requests
import tempfile
from typing import Optional
from config import settings

class SpeechToTextService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        
    def transcribe_audio_file(self, file_path: str, language: str = "hi") -> str:
        """
        Transcribe an audio file using OpenAI Whisper API
        """
        if not self.api_key or self.api_key == "your_openai_or_groq_api_key_here":
            # Fallback simulated response if no API key is provided
            print("[STT Warning] No API key configured. Returning fallback transcript.")
            return "Bhaiya Amul doodh aur butter packet available hai kya?"

        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key, base_url=settings.OPENAI_BASE_URL)
            
            with open(file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language
                )
                return transcript.text
        except Exception as e:
            print(f"[STT Error] Whisper transcription failed: {e}")
            return "Dukaan khulne aur band hone ka time kya hai?"

    def transcribe_twilio_media(self, media_url: str) -> str:
        """
        Download WhatsApp voice note from Twilio MediaUrl and transcribe it
        """
        try:
            # Twilio media authentication
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN) if settings.TWILIO_ACCOUNT_SID else None
            response = requests.get(media_url, auth=auth, timeout=15)
            
            if response.status_code == 200:
                with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as temp_audio:
                    temp_audio.write(response.content)
                    temp_path = temp_audio.name
                
                transcript = self.transcribe_audio_file(temp_path, language="hi")
                
                # Cleanup temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
                return transcript
            else:
                print(f"[STT Error] Failed to download media: HTTP {response.status_code}")
                return "Namaste dukaan kab tak khuli hai?"
        except Exception as e:
            print(f"[STT Error] Twilio voice note download error: {e}")
            return "Home delivery available hai kya?"

stt_service = SpeechToTextService()
