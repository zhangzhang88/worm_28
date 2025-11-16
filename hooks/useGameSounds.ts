import { useEffect, useRef, useCallback } from 'react';

interface UseGameSoundsReturn {
  playTypingSound: () => void;
  playCorrectSound: () => void;
  playErrorSound: () => void;
  stopAllSounds: () => void;
}

export const useGameSounds = (): UseGameSoundsReturn => {
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    typingAudioRef.current = new Audio('/typing.mp3');
    correctAudioRef.current = new Audio('/correct.mp3');
    errorAudioRef.current = new Audio('/error.mp3');

    return () => {
      if (typingAudioRef.current) typingAudioRef.current.pause();
      if (correctAudioRef.current) correctAudioRef.current.pause();
      if (errorAudioRef.current) errorAudioRef.current.pause();
    };
  }, []);

  const playAudio = useCallback((ref: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (!ref.current) return;
    ref.current.currentTime = 0;
    ref.current.play().catch((error) => console.error('Audio playback error:', error));
  }, []);

  const playTypingSound = useCallback(() => playAudio(typingAudioRef), [playAudio]);
  const playCorrectSound = useCallback(() => playAudio(correctAudioRef), [playAudio]);
  const playErrorSound = useCallback(() => playAudio(errorAudioRef), [playAudio]);

  const stopAllSounds = useCallback(() => {
    const refs = [typingAudioRef, correctAudioRef, errorAudioRef];
    refs.forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  }, []);

  return {
    playTypingSound,
    playCorrectSound,
    playErrorSound,
    stopAllSounds
  };
};
