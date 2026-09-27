import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer({ text, lang = 'hi', label = 'Listen' }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    // Clean emojis and markdown formatting
    const clean = text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}]/gu, '')
                      .replace(/\*(.*?)\*/g, '$1');

    const utterance = new SpeechSynthesisUtterance(clean);
    
    // Choose appropriate voice/locale
    const langMap = {
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      en: 'en-IN',
      hinglish: 'hi-IN'
    };
    utterance.lang = langMap[lang] || 'hi-IN';
    utterance.rate = 0.95;

    // Pick best regional voice if available
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2))) ||
                          voices.find(v => v.lang.includes('IN')) ||
                          voices.find(v => v.lang.startsWith('en'));
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
        isPlaying
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
      }`}
    >
      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      <span>{isPlaying ? 'Playing...' : label}</span>
    </button>
  );
}
