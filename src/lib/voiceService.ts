// Voice service for Sarvam API integration
// Simple demo implementation for multilingual voice features with native fallbacks

import { Capacitor } from "@capacitor/core";
import { VoiceRecorder } from "capacitor-voice-recorder";

interface VoiceConfig {
  language: string;
  apiKey?: string;
}

// Map app language codes to Sarvam API language codes
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
};

class VoiceService {
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isNativeRecording = false;

  // Convert audio blob to base64
  private async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
  }

  private async ensureNativePermission(): Promise<void> {
    const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
    if (!hasPermission.value) {
      const request = await VoiceRecorder.requestAudioRecordingPermission();
      if (!request.value) {
        throw new Error('Microphone permission denied');
      }
    }
  }

  // Start recording audio
  async startRecording(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
        if (!canRecord.value) {
          throw new Error('Device cannot record audio');
        }

        await this.ensureNativePermission();
        await VoiceRecorder.startRecording();
        this.isRecording = true;
        this.isNativeRecording = true;
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Could not access microphone');
    }
  }

  // Stop recording and return audio blob
  async stopRecording(): Promise<Blob> {
    if (Capacitor.isNativePlatform()) {
      if (!this.isNativeRecording) {
        throw new Error('Not recording');
      }

      const result = await VoiceRecorder.stopRecording();
      this.isRecording = false;
      this.isNativeRecording = false;

      const recordData = result.value.recordDataBase64;
      if (!recordData) {
        throw new Error('No audio data captured');
      }

      const mimeType = result.value.mimeType || 'audio/aac';
      return this.base64ToBlob(recordData, mimeType);
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        this.isRecording = false;
        
        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Convert speech to text using Sarvam API (via backend)
  async speechToText(audioBlob: Blob, language: string): Promise<string> {
    try {
      const base64Audio = await this.audioToBase64(audioBlob);
      const sarvamLang = LANGUAGE_MAP[language] || LANGUAGE_MAP['en'];
      const mimeType = audioBlob.type || 'audio/aac';
      const format = mimeType.split('/')[1] || 'aac';

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://swasthyavaani-app.vercel.app/api';
      const response = await fetch(`${API_BASE_URL}/voice/speech-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          language: sarvamLang,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert speech to text');
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Error in speech to text:', error);
      throw error;
    }
  }

  // Convert text to speech using Sarvam API (via backend) or browser TTS as fallback
  async textToSpeech(text: string, language: string, speaker?: string): Promise<void> {
    try {
      const sarvamLang = LANGUAGE_MAP[language] || LANGUAGE_MAP['en'];
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://swasthyavaani-app.vercel.app/api';
      
      const payload: Record<string, string> = {
        text,
        language: sarvamLang,
      };

      if (speaker) {
        payload.speaker = speaker;
      }

      const response = await fetch(`${API_BASE_URL}/voice/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Fallback to browser TTS
        this.speakWithBrowserTTS(text, language);
        return;
      }

      // If we get audio blob, play it
      if (contentType && contentType.includes('audio')) {
        const audioBlob = await response.blob();
        this.playAudio(audioBlob);
      } else if (contentType && contentType.includes('application/json')) {
        const data = await response.json().catch(() => null);
        if (data?.note?.includes('fallback') || data?.message?.includes('fallback')) {
          this.speakWithBrowserTTS(text, language);
          return;
        }
        this.speakWithBrowserTTS(text, language);
      } else {
        this.speakWithBrowserTTS(text, language);
      }
    } catch (error) {
      console.error('Error in text to speech:', error);
      // Fallback to browser TTS
      this.speakWithBrowserTTS(text, language);
    }
  }

  // Browser TTS fallback
  private speakWithBrowserTTS(text: string, language: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map language codes to browser TTS codes
      const browserLangMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
      };
      
      utterance.lang = browserLangMap[language] || 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  }

  // Stop speaking
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Play audio blob
  private playAudio(audioBlob: Blob): void {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  }

  // Check if currently recording
  getRecordingState(): boolean {
    return this.isRecording;
  }
}

export const voiceService = new VoiceService();
export default voiceService;

