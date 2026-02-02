"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";

export type DailyEnglishItem = {
  id: string;
  day_number: number;
  english_text: string;
  korean_text: string;
  pronunciation: string;
  example_sentence: string | null;
  example_korean: string | null;
  category: string;
};

/**
 * 오늘의 한마디 영어 훅
 * - 오늘 날짜 기반으로 day_number 계산 (30일 순환)
 * - Web Speech API로 음성 재생
 */
export function useDailyEnglish() {
  const [item, setItem] = useState<DailyEnglishItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 오늘의 day_number (1~30 순환)
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const todayDayNumber = (dayOfYear % 30) + 1;

  useEffect(() => {
    async function fetchToday() {
      const { data } = await supabase
        .from("daily_english")
        .select("*")
        .eq("day_number", todayDayNumber)
        .single();

      if (data) setItem(data as DailyEnglishItem);
      setLoading(false);
    }
    fetchToday();
  }, [todayDayNumber]);

  // Web Speech API 음성 재생
  const speak = useCallback(
    (text: string, lang: "en-US" | "ko-KR" = "en-US") => {
      if (!("speechSynthesis" in window)) return;

      // 이미 재생 중이면 중지
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.7; // 시니어를 위해 느리게
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  // 영어 → 한국어 순차 재생
  const speakBoth = useCallback(() => {
    if (!item || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // 1. 영어 읽기
    const enUtterance = new SpeechSynthesisUtterance(item.english_text);
    enUtterance.lang = "en-US";
    enUtterance.rate = 0.6;
    enUtterance.volume = 1;
    enUtterance.onstart = () => setIsSpeaking(true);

    // 2. 잠시 후 한국어 뜻 읽기
    enUtterance.onend = () => {
      setTimeout(() => {
        const koUtterance = new SpeechSynthesisUtterance(item.korean_text);
        koUtterance.lang = "ko-KR";
        koUtterance.rate = 0.8;
        koUtterance.volume = 1;
        koUtterance.onend = () => setIsSpeaking(false);
        koUtterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(koUtterance);
      }, 500);
    };

    window.speechSynthesis.speak(enUtterance);
  }, [item]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { item, loading, todayDayNumber, isSpeaking, speak, speakBoth, stopSpeaking };
}
