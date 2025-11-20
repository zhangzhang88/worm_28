'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Global, css, keyframes } from '@emotion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SentenceData } from '../data/types';
import { congratulationsMessages } from '../congratulationsData';
import { useRemoteTTS } from '../hooks/useRemoteTTS';
import { useGameSounds } from '../hooks/useGameSounds';
import { VoiceSelector } from './typing-game/VoiceSelector';
import { ChevronLeft, ChevronRight, Headphones } from 'lucide-react';

// Styled components
const Container = styled.div<{ themeColor: string; fontFamily: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 100vh;
  width: 100vw;
  background-color: ${props => props.themeColor};
  color: #ffffff;
  font-family: ${props => props.fontFamily};
  transition: background-color 0.3s, color 0.3s;
  margin: 0;
  padding: 2rem;
  border: none;
  outline: none;
  box-sizing: border-box;
  position: relative;
  overflow: hidden; // PC端保持hidden

  @media (max-width: 768px) {
    overflow-y: auto; // 移动端允许滚动
    height: auto;
    min-height: 100vh;
    padding-bottom: 6rem;
  }
`;

const Logo = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
`;

const LessonTitle = styled.h1`
  font-size: 1.1rem;
  color: #bdc3c7;
  text-align: center;
  margin: 0;
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  padding: 1rem;
  overflow: hidden; // PC端保持hidden

  @media (max-width: 768px) {
    overflow: visible; // 移动端允内，以便滚
    margin-bottom: 4rem;
  }
`;

const ProgressText = styled.p<{ themeColor: string; position: 'left' | 'right' }>`
  display: none;
  @media (min-width: 768px) {
    display: block;
    position: absolute;
    top: 1rem;
    ${props => props.position}: 12%;
    font-size: 1.1rem;
    color: #bdc3c7;
    margin: 0;
    z-index: 1;
  }
`;

const MobileProgressText = styled.p<{ themeColor: string }>`
  display: block;
  @media (min-width: 768px) {
    display: none;
  }
  font-size: 1rem;
  color: ${props => props.themeColor};
  margin: 0.5rem 0;
`;

const ProgressBarContainer = styled.div`
  width: 80%;
  margin: 1rem auto;
  background-color: #05051d;
  border-radius: 15px;
  overflow: hidden;
  height: 20px;
  cursor: pointer;
  border: 1px solid #bdc3c7;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  background-color: #00ff66;
  width: ${props => props.progress}%;
  transition: width 0.3s;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  
  @media (max-width: 768px) {
    position: fixed;
    bottom: 20px;
    left: 0;
    background-color: ${(props: any) => props.theme?.backgroundColor || '#05051d'};
    z-index: 1000;
    padding-bottom: 20px;
    width: 100%;
  }
`;

const CentralButtonGroup = styled.div`
  display: flex;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const Button = styled.button<{ themeColor: string; disabled?: boolean; isLink?: boolean }>`
  background-color: transparent;
  color: white;
  border: none;
  padding: 0;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: opacity 0.3s;
  font-size: 0.9rem;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: none;
  }
`;

const NavigationButton = styled(Button)`
  @media (min-width: 769px) {
    margin: 0 10rem;
  }
`;

const ButtonFrame = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #1e1e2e;
  min-width: 1.5rem;
  height: 1.5rem;
  border: 1px solid white;
`;

const ButtonText = styled.span`
  font-size: 0.8rem;
  margin-left: 0.5rem;
`;

const ExtraSpacedButton = styled(Button)`
  margin-right: 0.5rem;
`;

const HomeButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;

  @media (min-width: 769px) {
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }

  @media (max-width: 768px) {
    bottom: 70px;
    right: 1rem;
    font-size: 0.6rem;
    padding: 0.25rem 0.5rem;
  }
`;

const ChineseMeaning = styled.div`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const AnswerDisplay = styled.div<{ showAnswer: boolean }>`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #FFD700;
  opacity: ${props => (props.showAnswer ? 1 : 0)};
  transition: opacity 0.3s ease;
  margin-top: -1rem;
`;

const WordContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
`;

const WordInputWrapper = styled.div<{ width: string; isLongWord: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 6px 15px 6px;
  width: ${props => props.isLongWord ? `calc(${props.width} + 3em)` : `calc(${props.width} + 0.5em)`};
  min-width: 2em;
  transition: width 0.3s ease;
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateY(-4px); }
  20%, 40%, 60%, 80% { transform: translateY(4px); }
`;

const WordInput = styled.input<{ isCorrect: boolean; isWrong: boolean; isCurrent: boolean; isLocked: boolean; isSubmitted: boolean; shake: boolean }>`
  width: 100%;
  min-width: 1.5em;
  padding: 1px 0;
  font-size: 3rem;
  border: none;
  background-color: transparent;
  color: ${props => (props.isSubmitted && props.isWrong) ? '#de1db6' : 'white'};
  text-align: center;
  outline: none;
  position: absolute;
  z-index: 1;
  pointer-events: ${props => (props.isLocked ? 'none' : 'auto')};
  transition: width 0.3s ease;
  caret-color: transparent;
  animation: ${props => props.shake ? css`${shakeAnimation} 0.5s ease-in-out` : 'none'};
`;

const WordUnderline = styled.div<{ isCorrect: boolean; isWrong: boolean; isCurrent: boolean; isPunctuation: boolean; isSubmitted: boolean; isLongWord: boolean; shake: boolean }>`
  position: relative;
  width: ${props => props.isLongWord ? 'calc(100% + 3em)' : 'calc(100% + 0.5em)'};
  min-width: 2em;
  height: 2px;
  background-color: ${props =>
    props.isPunctuation ? 'transparent' :
    props.isCurrent ? '#de1db6' :
    props.isSubmitted && props.isWrong ? '#de1db6' :
    'white'
  };
  margin-top: 60px;
  transition: width 0.3s ease;
  animation: ${props => props.shake ? css`${shakeAnimation} 0.5s ease-in-out` : 'none'};
`;

const Punctuation = styled.span`
  font-size: 2rem;
  display: inline-block;
  margin-left: -2px;
  position: absolute;
  bottom: 0;
`;

const CongratulationsContainer = styled.div<{ backgroundColor: string; fontColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: ${props => props.backgroundColor};
  color: ${props => props.fontColor};
`;

const CongratulationsTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
`;

const CongratulationsMessage = styled.p`
  font-size: 1.5rem;
  margin-bottom: 2rem;
`;

const TotalTime = styled.p`
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const IntermediatePageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #05051d;
  color: white;
  outline: none;
`;

const SentenceDisplay = styled.div`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const ChineseSentence = styled.div`
  margin-bottom: 1.5rem;
`;

const PronunciationDisplay = styled.div`
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #bdc3c7;
`;

const EnglishSentence = styled.div`
  margin-top: 1rem;
`;

const IntermediateButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #05051d;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ListeningModeContainer = styled(IntermediatePageContainer)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
`;

const ListeningModeButton = styled(Button)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const ExitListeningModeButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const AnimationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const AnimatedLogo = styled.div`
  width: 50px;
  height: 50px;
  background-color: #3498db;
  animation: ${bounce} 0.5s ease-in-out infinite;
  margin-bottom: 20px;
`;

const LogoUnderline = styled.div`
  width: 50px;
  height: 2px;
  background-color: #ffffff;
`;

const AnimationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #05051d;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

interface ProcessedWord {
  word: string;
  punctuation: string;
  input: string;
  isLocked: boolean;
  width: string;
  originalWidth: string;
  isLongWord: boolean;
  isShortWord: boolean;
  isMediumWord: boolean;
  isEightLetterWord: boolean;
  isSevenLetterWord: boolean;
  isSixLetterWord: boolean;
  isFiveLetterWord: boolean;
  isFourLetterWord: boolean;
}

interface TypingGameProps {
  courseId: string;
  lessonNumber: number;
  sentences: SentenceData[];
  totalLessons: number;
  lessonTitle: string;
}

const processSentence = (sentence: string): ProcessedWord[] => {
  if (!sentence) {
    console.error('Invalid sentence:', sentence);
    return [];
  }
  const words = sentence.split(/\s+/);
  return words.map(word => {
    const match = word.match(/^(.*?)([.,!?:;]*)$/);
    if (match) {
      const baseWord = match[1];
      const isLongWord = baseWord.length > 9;
      const isMediumWord = baseWord.length === 9;
      const isEightLetterWord = baseWord.length === 8;
      const isSevenLetterWord = baseWord.length === 7;
      const isSixLetterWord = baseWord.length === 6;
      const isFiveLetterWord = baseWord.length === 5;
      const isFourLetterWord = baseWord.length === 4;
      const isShortWord = baseWord.length <= 2;
      const baseWidth = `${baseWord.length + (
        isLongWord ? 5 : 
        isMediumWord ? 5.5 :
        isEightLetterWord ? 4.5 : 
        isSevenLetterWord ? 4.7 : 
        isSixLetterWord ? 3.3 : 
        isFiveLetterWord ? 5.0 : 
        isFourLetterWord ? 2.9 : 
        isShortWord ? 1 : 2
      )}em`;
      return { 
        word: baseWord, 
        punctuation: match[2], 
        input: '', 
        isLocked: false, 
        width: baseWidth,
        originalWidth: baseWidth,
        isLongWord,
        isShortWord,
        isMediumWord,
        isEightLetterWord,
        isSevenLetterWord,
        isSixLetterWord,
        isFiveLetterWord,
        isFourLetterWord
      };
    }
    const isLongWord = word.length > 9;
    const isMediumWord = word.length === 9;
    const isEightLetterWord = word.length === 8;
    const isSevenLetterWord = word.length === 7;
    const isSixLetterWord = word.length === 6;
    const isFiveLetterWord = word.length === 5;
    const isFourLetterWord = word.length === 4;
    const isShortWord = word.length <= 2;
    const baseWidth = `${word.length + (
      isLongWord ? 3.5 : 
      isMediumWord ? 2.6 : 
      isEightLetterWord ? 3.5 : 
      isSevenLetterWord ? 2.5 : 
      isSixLetterWord ? 2 : 
      isFiveLetterWord ? 1.7 : 
      isFourLetterWord ? 1.5 : 
      isShortWord ? 0.5 : 1
    )}em`;
    return { 
      word, 
      punctuation: '', 
      input: '', 
      isLocked: false, 
      width: baseWidth,
      originalWidth: baseWidth,
      isLongWord,
      isShortWord,
      isMediumWord,
      isEightLetterWord,
      isSevenLetterWord,
      isSixLetterWord,
      isFiveLetterWord,
      isFourLetterWord
    };
  });
};

const globalStyles = css`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    min-height: 100vh;
    background-color: #05051d;
    overflow: hidden;
  }
  @media (max-width: 768px) {
    body {
      overflow: auto;
    }
  }
  * {
    box-sizing: inherit;
  }
`;

export default function TypingGame({ courseId, lessonNumber, sentences: initialSentences = [], totalLessons, lessonTitle }: TypingGameProps) {
  const [sentences, setSentences] = useState<SentenceData[]>(initialSentences);
  const [themeColor, setThemeColor] = useState('#05051d');
  const [selectedFont, setSelectedFont] = useState('Tahoma, sans-serif');
  const [time, setTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [processedWords, setProcessedWords] = useState<ProcessedWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showIntermediatePage, setShowIntermediatePage] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsMessage, setCongratulationsMessage] = useState('');
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const intermediatePageRef = useRef<HTMLDivElement>(null);
  const textWidthRef = useRef<HTMLSpanElement>(null);
  const nextLessonButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  const [isListeningMode, setIsListeningMode] = useState(false);
  const [listeningModeIndex, setListeningModeIndex] = useState(0);
  const [isPlayingListeningMode, setIsPlayingListeningMode] = useState(false);

  const [showAnimation, setShowAnimation] = useState(true);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const { playTypingSound, playCorrectSound, playErrorSound, stopAllSounds } = useGameSounds();
  const {
    isSpeechSupported,
    isPlayingSpeech,
    voices,
    selectedVoiceId,
    handleVoiceChange,
    speakOnce,
    speakTwice,
    cancelSpeech
  } = useRemoteTTS({
    defaultVoiceId: 'en-US-JennyNeural'
  });

  const [shakeWords, setShakeWords] = useState<boolean[]>([]);
  const [isAnswerSubmittedAndWrong, setIsAnswerSubmittedAndWrong] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
      setIsAnimationComplete(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userSentences = localStorage.getItem(`userSentencesLesson${lessonNumber}`);
        if (userSentences) {
          try {
            const parsedSentences = JSON.parse(userSentences);
            if (Array.isArray(parsedSentences) && parsedSentences.length > 0) {
              setSentences(parsedSentences);
            } else {
              console.error('Invalid user sentences data:', parsedSentences);
              setSentences(initialSentences);
            }
          } catch (error) {
            console.error('Failed to parse user sentences:', error);
            setSentences(initialSentences);
          }
        } else {
          setSentences(initialSentences);
        }

        const savedIndex = localStorage.getItem(`currentSentenceIndexLesson${lessonNumber}`);
        if (savedIndex) {
          const parsedIndex = parseInt(savedIndex, 10);
          if (!isNaN(parsedIndex) && parsedIndex >= 0) {
            setCurrentSentenceIndex(parsedIndex);
          }
        }

        setIsLoading(false);
        setIsDataReady(true);
      } catch (error) {
        console.error('Error in loadData:', error);
        setIsLoading(false);
        setIsDataReady(false);
      }
    };

    loadData();
  }, [lessonNumber, initialSentences]);

  useEffect(() => {
    if (!sentences || sentences.length === 0) {
      return;
    }

    setCurrentSentenceIndex((prevIndex) => {
      if (prevIndex < 0) {
        return 0;
      }

      if (prevIndex >= sentences.length) {
        return sentences.length - 1;
      }

      return prevIndex;
    });
  }, [sentences]);

  useEffect(() => {
    if (!isDataReady || !sentences || sentences.length === 0 || currentSentenceIndex >= sentences.length || !isAnimationComplete) {
      return;
    }

    const currentSentence = sentences[currentSentenceIndex] || { sentence: '', chinese: '', pronunciation: '' };
    if (!currentSentence || !currentSentence.sentence) {
      console.error('Invalid sentence data:', currentSentence);
      return;
    }

    setProcessedWords(processSentence(currentSentence.sentence));
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setIsSubmitted(false);
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 0);

    localStorage.setItem(`currentSentenceIndexLesson${lessonNumber}`, currentSentenceIndex.toString());
    if (!showIntermediatePage && !isListeningMode) {
      playSentenceAudio(currentSentence.sentence, currentSentenceIndex + 1);
    }
  }, [currentSentenceIndex, sentences, showIntermediatePage, lessonNumber, isDataReady, isListeningMode, isAnimationComplete]);

  useEffect(() => {
    try {
      const timer = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
      return () => {
        clearInterval(timer);
      };
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, []);

  useEffect(() => {
    try {
      if (showIntermediatePage && intermediatePageRef.current) {
        intermediatePageRef.current.focus();
        playSentenceAudio(sentences[currentSentenceIndex].sentence, currentSentenceIndex + 1);
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, [showIntermediatePage, currentSentenceIndex, sentences]);

  useEffect(() => {
    try {
      if (showCongratulations && nextLessonButtonRef.current) {
        nextLessonButtonRef.current.focus();
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, [showCongratulations]);

  const stopAllAudio = useCallback(() => {
    cancelSpeech();
    stopAllSounds();
  }, [cancelSpeech, stopAllSounds]);

  useEffect(() => {
    if (isListeningMode && isPlayingListeningMode) {
      const playNextSentence = async () => {
        if (listeningModeIndex < sentences.length) {
          try {
            await playSentenceAudioTwice(sentences[listeningModeIndex].sentence, listeningModeIndex + 1);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setListeningModeIndex(prevIndex => prevIndex + 1);
          } catch (error) {
            console.error('Error in listening mode:', error);
            setIsPlayingListeningMode(false);
          }
        } else {
          setIsPlayingListeningMode(false);
        }
      };
      playNextSentence();
    }
  }, [isListeningMode, isPlayingListeningMode, listeningModeIndex, sentences]);

  const calculateTextWidth = (text: string) => {
    if (textWidthRef.current) {
      textWidthRef.current.textContent = text;
      return `${textWidthRef.current.offsetWidth / 16 + 1}em`;
    }
    return `${text.length + 2}em`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const playSentenceAudio = (text: string, _sequenceNumber: number): Promise<void> => {
    if (!isSpeechSupported) {
      return Promise.reject(new Error('语音服务暂不可用'));
    }
    return speakOnce(text).catch(error => {
      console.error('Error playing audio:', error);
      throw error;
    });
  };

  const playSentenceAudioTwice = async (text: string, _sequenceNumber: number) => {
    try {
      await speakTwice(text);
    } catch (error) {
      console.error('Error playing audio twice:', error);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const cleanedValue = value.replace(/[^a-zA-Z0-9-''']/g, "");
    setProcessedWords(prev => {
      const newWords = [...prev];
      const originalWord = newWords[index].word;
      let newWidth = newWords[index].originalWidth;
      if (cleanedValue.length > originalWord.length) {
        newWidth = calculateTextWidth(cleanedValue);
      }
      newWords[index] = { 
        ...newWords[index], 
        input: cleanedValue,
        width: newWidth
      };
      return newWords;
    });
    playTypingSound();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.ctrlKey) {
      if (e.key === ';') {
        e.preventDefault();
        toggleAnswer();
        return;
      } else if (e.key === "'") {
        e.preventDefault();
        playSentenceAudio(sentences[currentSentenceIndex].sentence, currentSentenceIndex + 1);
        return;
      } else if (e.key === 'k') {
        e.preventDefault();
        clearInput();
        return;
      }
      // 如果按下Ctrl键，不执行自动清空错误单词的操作
      return;
    }

    if (isAnswerSubmittedAndWrong) {
      if (e.key === 'Enter') {
        e.preventDefault();
        await checkAnswer();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        handleClearNextIncorrectWord(true);
        return;
      }
      // 允许在错误单词的输入框中输入
      if (index === currentErrorIndex) {
        return; // 允许正常输入
      }
      // 对于其他输入框，保持原有行为
      e.preventDefault();
      handleFixFirstIncorrectWord();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      cancelSpeech();
      await checkAnswer();
      return;
    }

    if (e.key === 'Backspace' && inputRefs.current[index]?.value === '') {
      e.preventDefault();
      let prevIndex = index - 1;
      while (prevIndex >= 0 && processedWords[prevIndex].word === '') {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setCurrentWordIndex(prevIndex);
        inputRefs.current[prevIndex]?.focus();
      }
      return;
    }

    playTypingSound();

    if (e.key === 'ArrowRight' || (e.key === ' ' && index < processedWords.length - 1)) {
      e.preventDefault();
      let nextIndex = index + 1;
      while (nextIndex < processedWords.length && processedWords[nextIndex].word === '') {
        nextIndex++;
      }
      setCurrentWordIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || (e.key === ' ' && index > 0)) {
      e.preventDefault();
      let prevIndex = index - 1;
      while (prevIndex >= 0 && processedWords[prevIndex].word === '') {
        prevIndex--;
      }
      setCurrentWordIndex(prevIndex);
      inputRefs.current[prevIndex]?.focus();
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (isAnswerSubmittedAndWrong) {
        handleClearNextIncorrectWord(true);
      } else if (index < processedWords.length - 1) {
        let nextIndex = index + 1;
        while (nextIndex < processedWords.length && processedWords[nextIndex].word === '') {
          nextIndex++;
        }
        setCurrentWordIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleFixFirstIncorrectWord = () => {
    const firstIncorrectIndex = processedWords.findIndex(word => !isWordCorrect(word));
    if (firstIncorrectIndex !== -1) {
      setCurrentWordIndex(firstIncorrectIndex);
      setCurrentErrorIndex(firstIncorrectIndex);
      setProcessedWords(prev => {
        const newWords = [...prev];
        newWords[firstIncorrectIndex] = {
          ...newWords[firstIncorrectIndex],
          input: '',
          width: newWords[firstIncorrectIndex].originalWidth,
          isLocked: false // 确保解锁错误单词
        };
        return newWords;
      });
      setTimeout(() => {
        if (inputRefs.current[firstIncorrectIndex]) {
          inputRefs.current[firstIncorrectIndex].focus();
        }
      }, 0);
    }
  };

  const handleClearNextIncorrectWord = (includeFirst: boolean = false) => {
    const startIndex = includeFirst ? -1 : (currentErrorIndex ?? -1);
    const nextIncorrectIndex = processedWords.findIndex((word, idx) => idx > startIndex && !isWordCorrect(word));
    if (nextIncorrectIndex !== -1) {
      setCurrentWordIndex(nextIncorrectIndex);
      setCurrentErrorIndex(nextIncorrectIndex);
      setProcessedWords(prev => {
        const newWords = [...prev];
        newWords[nextIncorrectIndex] = {
          ...newWords[nextIncorrectIndex],
          input: '',
          width: newWords[nextIncorrectIndex].originalWidth,
          isLocked: false
        };
        return newWords;
      });
      setTimeout(() => {
        if (inputRefs.current[nextIncorrectIndex]) {
          inputRefs.current[nextIncorrectIndex].focus();
        }
      }, 0);
    }
  };

  const clearInput = () => {
    setProcessedWords(prev =>
      prev.map(word => ({ ...word, input: '', width: word.originalWidth }))
    );
    setCurrentWordIndex(0);
    setIsSubmitted(false);
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 0);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const normalizeText = (text: string) => 
    text.toLowerCase().replace(/[''']/g, "").replace(/[^a-z0-9-]/g, "").trim();

  const isWordCorrect = (word: ProcessedWord): boolean => {
    const normalizedInput = normalizeText(word.input);
    const normalizedWord = normalizeText(word.word);
    return normalizedInput === normalizedWord;
  };

  const checkAnswer = async () => {
    setIsSubmitted(true);
    const isCorrect = processedWords.every(isWordCorrect);

    if (isCorrect) {
      playCorrectSound();
      setTotalTime(prevTotal => prevTotal + time);
      setShowIntermediatePage(true);
      setIsAnswerSubmittedAndWrong(false);
      setCurrentErrorIndex(null);
    } else {
      playErrorSound();
      const newShakeWords = processedWords.map(word => !isWordCorrect(word));
      setShakeWords(newShakeWords);
      setProcessedWords(prev => prev.map(word => ({
        ...word,
        isLocked: isWordCorrect(word)
      })));
      setIsAnswerSubmittedAndWrong(true);
      setCurrentErrorIndex(null);
      
      // 重置震动效果
      setTimeout(() => {
        setShakeWords(new Array(processedWords.length).fill(false));
      }, 500);

      // 将焦点设置到第一个错误的单词，但不清空它
      const firstIncorrectIndex = processedWords.findIndex(word => !isWordCorrect(word));
      if (firstIncorrectIndex !== -1) {
        setCurrentWordIndex(firstIncorrectIndex);
        setTimeout(() => {
          if (inputRefs.current[firstIncorrectIndex]) {
            inputRefs.current[firstIncorrectIndex].focus();
          }
        }, 0);
      }
    }
  };

  const showCongratulationsPage = useCallback(() => {
    stopAllAudio();
    const randomMessage = congratulationsMessages[Math.floor(Math.random() * congratulationsMessages.length)];
    setCongratulationsMessage(randomMessage.message);
    setShowCongratulations(true);
    setIsGameCompleted(true);
  }, [stopAllAudio]);

  const nextSentence = useCallback(() => {
    if (currentSentenceIndex === sentences.length - 1) {
      showCongratulationsPage();
    } else {
      setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % sentences.length);
    }
    setShowIntermediatePage(false);
    setTime(0);
    setIsSubmitted(false);
  }, [currentSentenceIndex, sentences.length, showCongratulationsPage]);

  const previousSentence = useCallback(() => {
    setCurrentSentenceIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : sentences.length - 1));
  }, [sentences.length]);

  const calculateProgress = () => {
    const totalSentences = sentences.length;
    const completedSentences = currentSentenceIndex + 1;
    return (completedSentences / totalSentences) * 100;
  };

  const restartCurrentSentence = useCallback(() => {
    const currentSentence = sentences[currentSentenceIndex];
    setProcessedWords(processSentence(currentSentence.sentence));
    setCurrentWordIndex(0);
    setShowAnswer(false);
    playSentenceAudio(currentSentence.sentence, currentSentenceIndex + 1);
    setShowIntermediatePage(false);
    setTime(0);
    setIsSubmitted(false);
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 0);
  }, [currentSentenceIndex, sentences]);

  const handleIntermediatePageKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'j') {
      e.preventDefault();
      restartCurrentSentence();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      cancelSpeech();
      nextSentence();
    }
  }, [nextSentence, restartCurrentSentence, cancelSpeech]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const progressPercent = (clickX / progressBar.offsetWidth);
    const targetSentenceIndex = Math.floor(progressPercent * sentences.length);
    setCurrentSentenceIndex(targetSentenceIndex);
  };

  const goToNextLesson = () => {
    const nextLessonNumber = lessonNumber + 1;
    if (nextLessonNumber <= totalLessons) {
      const nextPath = `/courses/${courseId}/lessons/${nextLessonNumber}`;
      router.push(nextPath);
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  const enterListeningMode = () => {
    cancelSpeech();
    setIsListeningMode(true);
    setListeningModeIndex(0);
    setIsPlayingListeningMode(true);
  };

  const exitListeningMode = () => {
    cancelSpeech();
    setIsListeningMode(false);
    setIsPlayingListeningMode(false);
  };

  const congratulationsBackgroundColor = themeColor;
  const congratulationsFontColor = '#ffffff';

  if (showAnimation) {
    return (
      <AnimationOverlay>
        <AnimationWrapper>
          <AnimatedLogo />
          <LogoUnderline />
        </AnimationWrapper>
      </AnimationOverlay>
    );
  }

  if (isLoading || !isDataReady || !isAnimationComplete) {
    return <LoadingOverlay>加载中...</LoadingOverlay>;
  }

  if (!sentences || sentences.length === 0) {
    return <LoadingOverlay>没有可用的句子数据</LoadingOverlay>;
  }

  if (!isSpeechSupported) {
    return <LoadingOverlay>语音服务未配置或暂不可用</LoadingOverlay>;
  }

  if (showIntermediatePage) {
    return (
      <IntermediatePageContainer
        ref={intermediatePageRef}
        tabIndex={0}
        onKeyDown={handleIntermediatePageKeyDown}
      >
        <SentenceDisplay>
          <ChineseSentence>
            {sentences[currentSentenceIndex].chinese}
          </ChineseSentence>
          <PronunciationDisplay>
            {sentences[currentSentenceIndex].pronunciation}
          </PronunciationDisplay>
          <EnglishSentence>
            {sentences[currentSentenceIndex].sentence}
          </EnglishSentence>
        </SentenceDisplay>
        <IntermediateButtonGroup>
          <Button 
            onClick={restartCurrentSentence} 
            themeColor={themeColor}
          >
            <ButtonFrame>Ctrl+j</ButtonFrame>
            <ButtonText>再来一次</ButtonText>
          </Button>
          <Button 
            onClick={nextSentence} 
            themeColor={themeColor}
          >
            <ButtonFrame>Enter</ButtonFrame>
            <ButtonText>下一个</ButtonText>
          </Button>
        </IntermediateButtonGroup>
      </IntermediatePageContainer>
    );
  }

  if (showCongratulations) {
    return (
      <CongratulationsContainer backgroundColor={congratulationsBackgroundColor} fontColor={congratulationsFontColor}>
        <CongratulationsTitle>Congratulations!</CongratulationsTitle>
        <CongratulationsMessage>{congratulationsMessage}</CongratulationsMessage>
        <TotalTime>Total practice time: {formatTime(totalTime)}</TotalTime>
        <ButtonGroup>
          <Button 
            onClick={() => {
              setCurrentSentenceIndex(0);
              setTime(0);
              setTotalTime(0);
              setShowCongratulations(false);
              setIsGameCompleted(false);
            }} 
            themeColor={themeColor}
          >
            Restart
          </Button>
          <Button
            ref={nextLessonButtonRef}
            onClick={goToNextLesson}
            themeColor={themeColor}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goToNextLesson();
              }
            }}
          >
            Next Lesson
          </Button>
          <Link href={`/courses/${courseId}`} passHref>
            <Button as="a" themeColor={themeColor} isLink={true}>
              Return to Course
            </Button>
          </Link>
        </ButtonGroup>
      </CongratulationsContainer>
    );
  }

  return (
    <React.Fragment>
      <Global styles={globalStyles} />
      <Container themeColor={themeColor} fontFamily={selectedFont}>
        <LessonTitle>{lessonTitle}</LessonTitle>
        <ProgressText themeColor={themeColor} position="left">
          Progress: {currentSentenceIndex + 1} / {sentences.length}
        </ProgressText>
        <ProgressText themeColor={themeColor} position="right">
          Time: {formatTime(time + totalTime)}
        </ProgressText>
        <ProgressBarContainer onClick={handleProgressBarClick}>
          <ProgressBar progress={calculateProgress()} />
        </ProgressBarContainer>
        {isSpeechSupported && voices.length > 0 && (
          <VoiceSelector
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            onChange={handleVoiceChange}
          />
        )}
        <ContentWrapper>
          <AnswerDisplay showAnswer={showAnswer}>
            {sentences[currentSentenceIndex].sentence}
          </AnswerDisplay>
          <ChineseMeaning>{sentences[currentSentenceIndex].chinese}</ChineseMeaning>
          <WordContainer>
            {processedWords.map(({ word, punctuation, input, isLocked, width, isLongWord }, index) => (
              <WordInputWrapper key={index} width={width} isLongWord={isLongWord}>
                <WordInput
                  ref={el => {
                    if (el) inputRefs.current[index] = el;
                  }}
                  value={input}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  isCorrect={isWordCorrect({ ...processedWords[index] })}
                  isWrong={input.trim() !== '' && !isWordCorrect({ ...processedWords[index] })}
                  isCurrent={index === currentWordIndex}
                  isLocked={isLocked && index !== currentErrorIndex}
                  isSubmitted={isSubmitted}
                  autoFocus={index === currentWordIndex}
                  shake={shakeWords[index]}
                />
                <WordUnderline
                  isCorrect={isWordCorrect({ ...processedWords[index] })}
                  isWrong={input.trim() !== '' && !isWordCorrect({ ...processedWords[index] })}
                  isCurrent={index === currentWordIndex}
                  isPunctuation={punctuation !== ''}
                  isSubmitted={isSubmitted}
                  isLongWord={isLongWord}
                  shake={shakeWords[index]}
                />
                {punctuation && <Punctuation>{punctuation}</Punctuation>}
              </WordInputWrapper>
            ))}
          </WordContainer>
        </ContentWrapper>
        <ButtonGroup>
          <NavigationButton onClick={previousSentence} themeColor={themeColor}>
            <ButtonFrame>
            <ChevronLeft size={16} />
            </ButtonFrame>
          </NavigationButton>
          <CentralButtonGroup>
            <ExtraSpacedButton onClick={() => playSentenceAudio(sentences[currentSentenceIndex].sentence, currentSentenceIndex + 1)} themeColor={themeColor}>
              <ButtonFrame>Ctrl</ButtonFrame>
              <ButtonFrame>&apos;</ButtonFrame>
              <ButtonText>播放发音</ButtonText>
            </ExtraSpacedButton>
            <ExtraSpacedButton onClick={checkAnswer} themeColor={themeColor}>
              <ButtonFrame>Enter</ButtonFrame>
              <ButtonText>提交</ButtonText>
            </ExtraSpacedButton>
            <ExtraSpacedButton onClick={toggleAnswer} themeColor={themeColor}>
              <ButtonFrame>Ctrl</ButtonFrame>
              <ButtonFrame>;</ButtonFrame>
              <ButtonText>显示答案</ButtonText>
            </ExtraSpacedButton>
            <Button onClick={handleFixFirstIncorrectWord} themeColor={themeColor}>
              <ButtonFrame>Space</ButtonFrame>
              <ButtonText>修复错误单词</ButtonText>
            </Button>
          </CentralButtonGroup>
          <NavigationButton onClick={() => setShowIntermediatePage(true)} themeColor={themeColor}>
            <ButtonFrame>
              <ChevronRight size={16} />
            </ButtonFrame>
          </NavigationButton>
        </ButtonGroup>
        <Link href={`/courses/${courseId}`} passHref legacyBehavior>
          <HomeButton themeColor={themeColor} isLink={true}>
            返回上一页
          </HomeButton>
        </Link>
        {!isListeningMode && (
          <ListeningModeButton onClick={enterListeningMode} themeColor={themeColor}>
            <ButtonFrame>
              <Headphones size={16} />
            </ButtonFrame>
            <ButtonText>听力模式</ButtonText>
          </ListeningModeButton>
        )}
      </Container>
      {isListeningMode && (
        <ListeningModeContainer>
          <SentenceDisplay>
            <ChineseSentence>
              {sentences[listeningModeIndex]?.chinese}
            </ChineseSentence>
            <PronunciationDisplay>
              {sentences[listeningModeIndex]?.pronunciation}
            </PronunciationDisplay>
            <EnglishSentence>
              {sentences[listeningModeIndex]?.sentence}
            </EnglishSentence>
          </SentenceDisplay>
          <ExitListeningModeButton onClick={exitListeningMode} themeColor={themeColor}>
            <ButtonFrame>
              <Headphones size={16} />
            </ButtonFrame>
            <ButtonText>退出听力模式</ButtonText>
          </ExitListeningModeButton>
        </ListeningModeContainer>
      )}
      <span ref={textWidthRef} style={{ visibility: 'hidden', position: 'absolute', fontSize: '2.5rem', fontFamily: selectedFont }}></span>
    </React.Fragment>
  );
}
