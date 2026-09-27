/**
 * DukaanDost Voice Handler
 * Handles Speech-to-Text (STT) via Web Speech API,
 * Text-to-Speech (TTS) with Indian vernacular accents,
 * Audio waveform visualization, and voice note recording simulation.
 */

class DukaanVoiceHandler {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.synth = window.speechSynthesis || null;
        this.selectedVoice = null;
        this.recordingTimer = null;
        this.recordingSeconds = 0;
        this.onTranscriptCallback = null;
        this.onRecordingStateChange = null;

        this.initSTT();
        this.initTTS();
    }

    /**
     * Initialize Web Speech Recognition
     */
    initSTT() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'hi-IN'; // Default to Hindi / Indian English

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.startTimer();
                if (this.onRecordingStateChange) this.onRecordingStateChange(true);
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const transcript = finalTranscript || interimTranscript;
                if (this.onTranscriptCallback) {
                    this.onTranscriptCallback(transcript, Boolean(finalTranscript));
                }
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.stopRecording();
            };

            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            console.warn('Web Speech API is not supported in this browser. Falling back to audio simulation.');
        }
    }

    /**
     * Initialize Text-to-Speech voices and select Indian English / Hindi voice
     */
    initTTS() {
        if (!this.synth) return;

        const setVoice = () => {
            const voices = this.synth.getVoices();
            // Look for Hindi, Indian English, or Google Indic voices
            this.selectedVoice = voices.find(v => 
                v.lang === 'hi-IN' || 
                v.lang === 'en-IN' || 
                v.name.includes('India') || 
                v.name.includes('Hindi')
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = setVoice;
        }
        setVoice();
    }

    /**
     * Start live voice recording
     */
    startRecording(lang = 'hi-IN', onTranscript, onStateChange) {
        this.onTranscriptCallback = onTranscript;
        this.onRecordingStateChange = onStateChange;

        if (this.recognition) {
            try {
                this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
                this.recognition.start();
            } catch (err) {
                console.warn('STT start failed or already active:', err);
                this.simulateVoiceRecording(onTranscript, onStateChange);
            }
        } else {
            this.simulateVoiceRecording(onTranscript, onStateChange);
        }
    }

    /**
     * Fallback: Realistic voice simulation if microphone is disabled or unsupported
     */
    simulateVoiceRecording(onTranscript, onStateChange) {
        this.isRecording = true;
        this.startTimer();
        if (onStateChange) onStateChange(true);

        const samplePrompts = [
            "Bhaiya Amul doodh aur butter available hai kya?",
            "Dukaan khulne aur band hone ka time kya hai?",
            "Kya home delivery mil sakti hai Sector 4 mein?",
            "Payment online Google Pay ya PhonePe se ho jayegi?",
            "Aashirvaad Atta 10kg packet ka rate kya hai?"
        ];
        const selected = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];

        let charIndex = 0;
        const interval = setInterval(() => {
            if (!this.isRecording) {
                clearInterval(interval);
                return;
            }
            charIndex += 4;
            const sub = selected.slice(0, charIndex);
            if (onTranscript) onTranscript(sub, charIndex >= selected.length);

            if (charIndex >= selected.length) {
                clearInterval(interval);
                setTimeout(() => this.stopRecording(), 400);
            }
        }, 120);
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        this.isRecording = false;
        this.stopTimer();
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        if (this.onRecordingStateChange) this.onRecordingStateChange(false);
    }

    startTimer() {
        this.recordingSeconds = 0;
        this.stopTimer();
        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            const timerEl = document.getElementById('voice-timer-display');
            if (timerEl) {
                const mins = Math.floor(this.recordingSeconds / 60);
                const secs = this.recordingSeconds % 60;
                timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    /**
     * Speak text aloud using Indian accent SpeechSynthesis
     */
    speak(text, lang = 'hi') {
        if (!this.synth) return;

        // Cancel previous speech if active
        this.synth.cancel();

        const cleanText = text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}]/gu, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95; // Natural conversational tempo
        utterance.pitch = 1.0;

        this.synth.speak(utterance);
    }

    stopSpeech() {
        if (this.synth) this.synth.cancel();
    }
}

// Global instance
window.dukaanVoice = new DukaanVoiceHandler();
