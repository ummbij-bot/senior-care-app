"use client";

import { useState, useEffect, useCallback } from "react";

type FontSize = "normal" | "large" | "xlarge";
type AccessibilitySettings = {
  fontSize: FontSize;
  highContrast: boolean;
};

const STORAGE_KEY = "senior-care-accessibility";

const FONT_SIZE_MAP: Record<FontSize, number> = {
  normal: 18,
  large: 22,
  xlarge: 26,
};

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  normal: "보통",
  large: "크게",
  xlarge: "아주 크게",
};

/**
 * 접근성 설정 관리 훅
 * - 폰트 크기 조절 (보통/크게/아주 크게)
 * - 고대비 모드
 * - localStorage에 설정 저장
 */
export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: "normal",
    highContrast: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 설정 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AccessibilitySettings;
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {
      // 저장된 설정 없음
    }
    setIsLoaded(true);
  }, []);

  // 설정 적용 함수
  const applySettings = useCallback((newSettings: AccessibilitySettings) => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;

    // 폰트 크기 적용
    html.style.fontSize = `${FONT_SIZE_MAP[newSettings.fontSize]}px`;

    // 고대비 모드 적용
    if (newSettings.highContrast) {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }
  }, []);

  // 설정 저장 및 적용
  const updateSettings = useCallback(
    (updates: Partial<AccessibilitySettings>) => {
      setSettings((prev) => {
        const newSettings = { ...prev, ...updates };

        // localStorage에 저장
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        } catch {
          // 저장 실패 무시
        }

        // 즉시 적용
        applySettings(newSettings);

        return newSettings;
      });
    },
    [applySettings]
  );

  // 폰트 크기 순환
  const cycleFontSize = useCallback(() => {
    const sizes: FontSize[] = ["normal", "large", "xlarge"];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSettings({ fontSize: sizes[nextIndex] });
  }, [settings.fontSize, updateSettings]);

  // 고대비 토글
  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !settings.highContrast });
  }, [settings.highContrast, updateSettings]);

  // TTS로 화면 읽기
  const speakPageContent = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // 기존 음성 중단
    window.speechSynthesis.cancel();

    // 주요 콘텐츠 추출
    const main = document.querySelector("main");
    const header = document.querySelector("header h1");

    let textToRead = "";

    if (header) {
      textToRead += header.textContent + ". ";
    }

    if (main) {
      // 버튼, 링크의 텍스트 추출
      const elements = main.querySelectorAll(
        "h1, h2, h3, p, button, a, [aria-label]"
      );
      elements.forEach((el) => {
        const ariaLabel = el.getAttribute("aria-label");
        const text = ariaLabel || el.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          textToRead += text + ". ";
        }
      });
    }

    if (!textToRead) {
      textToRead = "화면 내용을 읽을 수 없습니다.";
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "ko-KR";
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  // 음성 중단
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    settings,
    isLoaded,
    fontSizeLabel: FONT_SIZE_LABELS[settings.fontSize],
    cycleFontSize,
    toggleHighContrast,
    speakPageContent,
    stopSpeaking,
    updateSettings,
  };
}
