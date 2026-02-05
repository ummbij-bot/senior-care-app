"use client";

import { useCallback, useRef } from "react";

/**
 * TTS 음성 출력 훅 (Web Speech API)
 *
 * 시니어 사용자에게 음성으로 상태를 안내.
 * - 한국어(ko-KR) 기본
 * - 시니어에게 맞춘 느린 속도 (rate: 0.9)
 * - 중복 발화 방지 (기존 음성 자동 중단)
 *
 * @example
 * const { speak, stop } = useSpeech();
 * <button onClick={() => speak("복약 확인이 완료되었습니다.")}>완료</button>
 */
export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** 텍스트를 한국어로 읽어줌 */
  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  }) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // 기존 발화 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? "ko-KR";
    utterance.rate = options?.rate ?? 0.9;   // 시니어용 느린 속도
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  /** 현재 발화 중단 */
  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }, []);

  /** 복약 완료 전용 음성 */
  const speakMedicationDone = useCallback(() => {
    speak("복약 확인이 완료되었습니다. 건강한 하루 되세요!");
  }, [speak]);

  /** 긴급 안내 음성 */
  const speakEmergency = useCallback((target: string) => {
    speak(`${target}에 전화합니다. 한번 더 누르세요.`);
  }, [speak]);

  return { speak, stop, speakMedicationDone, speakEmergency };
}
