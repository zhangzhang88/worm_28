import { useState, useMemo, useRef, useCallback, useEffect } from 'react';

export interface RemoteVoiceOption {
  id: string;
  label: string;
  model?: string;
}

interface UseRemoteTTSOptions {
  voices?: RemoteVoiceOption[];
  defaultVoiceId?: string;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  responseFormat?: 'mp3' | 'wav' | 'ogg';
  playbackGapMs?: number;
  courseId?: string;
  lessonNumber?: number | string;
}

interface UseRemoteTTSReturn {
  isSpeechSupported: boolean;
  isPlayingSpeech: boolean;
  voices: RemoteVoiceOption[];
  selectedVoiceId: string;
  handleVoiceChange: (value: string) => void;
  speakOnce: (text: string) => Promise<void>;
  speakTwice: (text: string) => Promise<void>;
  cancelSpeech: () => void;
}

const DEFAULT_REMOTE_VOICES: RemoteVoiceOption[] = [
  { id: 'en-US-JennyNeural', label: 'Jenny (English - US)' },
  { id: 'en-US-GuyNeural', label: 'Guy (English - US)' },
  { id: 'en-GB-RyanNeural', label: 'Ryan (English - UK)' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia (English - UK)' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha (English - AU)' },
  { id: 'alloy', label: 'Alloy (OpenAI)', model: 'gpt-4o-mini-tts' },
  { id: 'verse', label: 'Verse (OpenAI)', model: 'gpt-4o-mini-tts' }
];

const DEFAULT_GAP_MS = 1200;
const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_TTS_MODEL ||
  process.env.NEXT_PUBLIC_TTS_DEFAULT_MODEL ||
  'gpt-4o-mini-tts';
const DEFAULT_RESPONSE_FORMAT = (process.env.NEXT_PUBLIC_TTS_AUDIO_FORMAT as
  | 'mp3'
  | 'wav'
  | 'ogg') || 'mp3';
const DEFAULT_CACHE_ENDPOINT =
  process.env.NEXT_PUBLIC_TTS_CACHE_ENDPOINT || '/api/tts';

export function useRemoteTTS({
  voices: customVoices,
  defaultVoiceId,
  apiUrl = DEFAULT_CACHE_ENDPOINT,
  apiKey,
  model = DEFAULT_MODEL,
  responseFormat = DEFAULT_RESPONSE_FORMAT,
  playbackGapMs = DEFAULT_GAP_MS,
  courseId,
  lessonNumber
}: UseRemoteTTSOptions = {}): UseRemoteTTSReturn {
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const voices = useMemo(
    () => (customVoices && customVoices.length > 0 ? customVoices : DEFAULT_REMOTE_VOICES),
    [customVoices]
  );

  useEffect(() => {
    const hasBrowserAPIs = typeof window !== 'undefined' && typeof Audio !== 'undefined';
    setIsSpeechSupported(Boolean(hasBrowserAPIs && apiUrl));
  }, [apiUrl]);

  useEffect(() => {
    if (!selectedVoiceId && voices.length > 0) {
      const fallbackVoice =
        voices.find((voice) => voice.id === defaultVoiceId) ??
        voices[0];
      setSelectedVoiceId(fallbackVoice.id);
    } else if (
      selectedVoiceId &&
      voices.length > 0 &&
      !voices.some((voice) => voice.id === selectedVoiceId)
    ) {
      setSelectedVoiceId(voices[0].id);
    }
  }, [voices, defaultVoiceId, selectedVoiceId]);

  const cleanupAudioResources = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cleanupAudioResources();
    setIsPlayingSpeech(false);
  }, [cleanupAudioResources]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const buildRequestPayload = useCallback(
    (text: string) => {
      const activeVoice =
        voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0];
      if (!activeVoice) {
        throw new Error('未找到可用的语音选项');
      }
      if (!courseId || lessonNumber === undefined || lessonNumber === null) {
        throw new Error('需要 courseId 和 lessonNumber 才能生成可缓存的音频');
      }
      return {
        model: activeVoice.model ?? model,
        voiceId: activeVoice.id,
        responseFormat,
        text,
        courseId,
        lessonNumber: String(lessonNumber)
      };
    },
    [model, responseFormat, selectedVoiceId, voices, courseId, lessonNumber]
  );

  const fetchSpeechAudio = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        throw new Error('请输入要朗读的文本');
      }
      if (!apiUrl) {
        throw new Error('TTS 服务地址未配置');
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const payload = buildRequestPayload(text);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          errorText || `TTS 服务返回错误：${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('生成的音频为空');
      }

      return blob;
    },
    [apiUrl, apiKey, buildRequestPayload]
  );

  const playAudioBlob = useCallback(
    (blob: Blob) => {
      cleanupAudioResources();
      const url = URL.createObjectURL(blob);
      currentObjectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsPlayingSpeech(true);

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setIsPlayingSpeech(false);
          cleanupAudioResources();
          resolve();
        };
        audio.onerror = () => {
          setIsPlayingSpeech(false);
          cleanupAudioResources();
          reject(new Error('音频播放失败'));
        };

        audio
          .play()
          .catch((error) => {
            setIsPlayingSpeech(false);
            cleanupAudioResources();
            reject(error);
          });
      });
    },
    [cleanupAudioResources]
  );

  const speakOnce = useCallback(
    async (text: string) => {
      cancelSpeech();
      const blob = await fetchSpeechAudio(text);
      await playAudioBlob(blob);
    },
    [cancelSpeech, fetchSpeechAudio, playAudioBlob]
  );

  const speakTwice = useCallback(
    async (text: string) => {
      cancelSpeech();
      const blob = await fetchSpeechAudio(text);
      await playAudioBlob(blob);
      await new Promise((resolve) => setTimeout(resolve, playbackGapMs));
      await playAudioBlob(blob);
    },
    [cancelSpeech, fetchSpeechAudio, playbackGapMs, playAudioBlob]
  );

  const handleVoiceChange = useCallback((value: string) => {
    setSelectedVoiceId(value);
    cancelSpeech();
  }, [cancelSpeech]);

  return {
    isSpeechSupported,
    isPlayingSpeech,
    voices,
    selectedVoiceId,
    handleVoiceChange,
    speakOnce,
    speakTwice,
    cancelSpeech
  };
}
