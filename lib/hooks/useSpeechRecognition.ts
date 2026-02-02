"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type SpeechRecognitionHook = {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  speak: (text: string) => void;
};

/**
 * 한국어 음성 인식 + TTS 훅 (복약 확인용)
 * - Web Speech API (Chrome/Edge)
 * - 키워드 매칭: "먹었", "복용", "드셨", "먹음"
 * - TTS: 복용 확인 시 음성 응답
 * - 미지원 브라우저 graceful fallback
 */
export function useSpeechRecognition(
  onRecognized?: (transcript: string) => void
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const onRecognizedRef = useRef(onRecognized);

  // 콜백 ref 최신 유지
  useEffect(() => {
    onRecognizedRef.current = onRecognized;
  }, [onRecognized]);

  // 브라우저 지원 확인 + 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "ko-KR";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcriptText = result[0].transcript.trim();

      setTranscript(transcriptText);
      setIsListening(false);

      // 복약 키워드 매칭
      const medicationKeywords = ["먹었", "복용", "드셨", "먹음", "먹엇"];
      const matched = medicationKeywords.some((kw) =>
        transcriptText.includes(kw)
      );

      if (matched && onRecognizedRef.current) {
        onRecognizedRef.current(transcriptText);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setError(null);
    setTranscript("");
    setIsListening(true);

    // 햅틱 피드백
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      recognitionRef.current.start();
    } catch {
      setError("마이크를 사용할 수 없습니다");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // TTS: 한국어 음성 출력
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.85; // 시니어를 위해 약간 느리게
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error,
    speak,
  };
}
