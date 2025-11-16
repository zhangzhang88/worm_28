import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  preferredVoiceNames?: string[];
  rate?: number;
  pitch?: number;
}

interface UseSpeechSynthesisReturn {
  isSpeechSupported: boolean;
  isPlayingSpeech: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  handleVoiceChange: (value: string) => void;
  speakOnce: (text: string) => Promise<void>;
  speakTwice: (text: string) => Promise<void>;
  cancelSpeech: () => void;
}

export function useSpeechSynthesis({
  preferredVoiceNames = [],
  rate = 0.9,
  pitch = 1
}: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const preferredVoiceSetRef = useRef(new Set(preferredVoiceNames));

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeechSupported(false);
      return;
    }
    setIsSpeechSupported(true);
    const synth = window.speechSynthesis;
    speechSynthesisRef.current = synth;

    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      const preferred = availableVoices.filter(voice => preferredVoiceSetRef.current.has(voice.name));
      const englishVoices = availableVoices.filter(voice => voice.lang?.toLowerCase().startsWith('en'));
      const merged = [...preferred];
      englishVoices.forEach(voice => {
        if (!merged.some(item => item.name === voice.name)) {
          merged.push(voice);
        }
      });
      const finalVoices = merged.length > 0 ? merged : availableVoices;
      setVoices(finalVoices);
    };

    updateVoices();
    const originalHandler = synth.onvoiceschanged;
    synth.onvoiceschanged = updateVoices;
    return () => {
      if (synth.onvoiceschanged === updateVoices) {
        synth.onvoiceschanged = originalHandler ?? null;
      }
    };
  }, []);

  useEffect(() => {
    if (voices.length === 0) {
      return;
    }
    setSelectedVoiceName((prev) => {
      if (prev && voices.some(voice => voice.name === prev)) {
        return prev;
      }
      const preferredVoice = voices.find(voice => preferredVoiceSetRef.current.has(voice.name));
      if (preferredVoice) {
        return preferredVoice.name;
      }
      const englishVoice = voices.find(voice => voice.lang?.toLowerCase().startsWith('en'));
      if (englishVoice) {
        return englishVoice.name;
      }
      return voices[0].name;
    });
  }, [voices]);

  const cancelSpeech = useCallback(() => {
    if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    setIsPlayingSpeech(false);
  }, []);

  const getActiveVoice = useCallback(() => {
    if (voices.length === 0) {
      return null;
    }
    const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
    if (selectedVoice) {
      return selectedVoice;
    }
    const preferredVoice = voices.find(voice => preferredVoiceSetRef.current.has(voice.name));
    if (preferredVoice) {
      return preferredVoice;
    }
    const englishVoice = voices.find(voice => voice.lang?.toLowerCase().startsWith('en'));
    return englishVoice || voices[0] || null;
  }, [voices, selectedVoiceName]);

  const speakOnce = useCallback((text: string) => {
    if (!speechSynthesisRef.current) {
      return Promise.reject(new Error('当前浏览器不支持语音播放'));
    }
    setIsPlayingSpeech(true);
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getActiveVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onend = () => {
        setIsPlayingSpeech(false);
        resolve();
      };
      utterance.onerror = (event) => {
        setIsPlayingSpeech(false);
        reject(event.error || new Error('语音播放失败'));
      };
      cancelSpeech();
      speechSynthesisRef.current?.speak(utterance);
    });
  }, [cancelSpeech, getActiveVoice, pitch, rate]);

  const speakTwice = useCallback(async (text: string) => {
    await speakOnce(text);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await speakOnce(text);
  }, [speakOnce]);

  const handleVoiceChange = useCallback((value: string) => {
    setSelectedVoiceName(value);
    cancelSpeech();
  }, [cancelSpeech]);

  return {
    isSpeechSupported,
    isPlayingSpeech,
    voices,
    selectedVoiceName,
    handleVoiceChange,
    speakOnce,
    speakTwice,
    cancelSpeech
  };
}
