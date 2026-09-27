import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceButton({ onTranscript, currentLang = 'hi' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;

      // Select speech recognition language
      const langMap = {
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        en: 'en-IN',
        hinglish: 'hi-IN'
      };
      recog.lang = langMap[currentLang] || 'hi-IN';

      recog.onstart = () => setIsRecording(true);
      recog.onend = () => setIsRecording(false);
      recog.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsRecording(false);
      };

      recog.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[0].isFinal && onTranscript) {
          onTranscript(transcript);
        }
      };

      setRecognition(recog);
    }
  }, [currentLang, onTranscript]);

  const toggleRecording = () => {
    if (!recognition) {
      // Browser fallback simulation if SpeechRecognition not supported
      alert("Microphone API not supported or blocked in this browser. You can type your query in any language.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      title={isRecording ? "Stop Listening" : "Tap to Speak (Voice Note)"}
      className={`relative p-3 rounded-full flex items-center justify-center transition-all ${
        isRecording
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105 animate-pulse'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-emerald-500/30'
      }`}
    >
      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
      )}
    </button>
  );
}
