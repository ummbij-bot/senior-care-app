"use client";

import { useState } from "react";
import {
  Settings,
  Type,
  Contrast,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
} from "lucide-react";
import { useAccessibility } from "@/lib/hooks/useAccessibility";

/**
 * 접근성 도구 모음
 * - 폰트 크기 조절
 * - 고대비 모드 토글
 * - 화면 읽어주기 (TTS)
 * - 하단에 플로팅 버튼으로 표시
 */
export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const {
    settings,
    isLoaded,
    fontSizeLabel,
    cycleFontSize,
    toggleHighContrast,
    speakPageContent,
    stopSpeaking,
  } = useAccessibility();

  // 로딩 전에는 렌더링하지 않음
  if (!isLoaded) return null;

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakPageContent();
      setIsSpeaking(true);
      // 음성 종료 감지
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            setIsSpeaking(false);
            clearInterval(checkSpeaking);
          }
        }, 500);
      }
    }
  };

  return (
    <>
      {/* 접근성 도구 모음 (열렸을 때) */}
      {isOpen && (
        <div
          className="fixed bottom-20 left-4 z-50 w-64 rounded-2xl border-2 border-border bg-surface-raised p-4 shadow-xl"
          role="dialog"
          aria-label="접근성 설정"
        >
          {/* 헤더 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">접근성 설정</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface"
              aria-label="접근성 설정 닫기"
            >
              <X className="h-5 w-5 text-text-muted" />
            </button>
          </div>

          {/* 설정 버튼들 */}
          <div className="space-y-3">
            {/* 글자 크기 */}
            <button
              onClick={cycleFontSize}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-surface p-3 hover:border-primary hover:bg-surface-raised active:scale-95"
              aria-label={`글자 크기: ${fontSizeLabel}. 누르면 변경됩니다.`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Type className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-text-primary">
                  글자 크기
                </p>
                <p className="text-sm text-text-secondary">{fontSizeLabel}</p>
              </div>
              <ChevronUp className="h-5 w-5 text-text-muted" />
            </button>

            {/* 고대비 모드 */}
            <button
              onClick={toggleHighContrast}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 active:scale-95 ${
                settings.highContrast
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface hover:border-primary hover:bg-surface-raised"
              }`}
              aria-label={`고대비 모드: ${settings.highContrast ? "켜짐" : "꺼짐"}. 누르면 전환됩니다.`}
              aria-pressed={settings.highContrast}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  settings.highContrast ? "bg-primary" : "bg-gray-100"
                }`}
              >
                <Contrast
                  className={`h-6 w-6 ${settings.highContrast ? "text-white" : "text-gray-600"}`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-text-primary">
                  고대비 모드
                </p>
                <p className="text-sm text-text-secondary">
                  {settings.highContrast ? "켜짐" : "꺼짐"}
                </p>
              </div>
            </button>

            {/* 화면 읽어주기 */}
            <button
              onClick={handleSpeak}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 active:scale-95 ${
                isSpeaking
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-border bg-surface hover:border-primary hover:bg-surface-raised"
              }`}
              aria-label={isSpeaking ? "읽기 중지" : "화면 읽어주기"}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isSpeaking ? "bg-emerald-500" : "bg-emerald-100"
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-text-primary">
                  {isSpeaking ? "읽기 중지" : "화면 읽어주기"}
                </p>
                <p className="text-sm text-text-secondary">
                  {isSpeaking ? "음성을 중단합니다" : "화면 내용을 읽어드립니다"}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
          isOpen
            ? "bg-primary text-white"
            : "bg-surface-raised border-2 border-border text-text-primary hover:border-primary"
        }`}
        aria-label={isOpen ? "접근성 설정 닫기" : "접근성 설정 열기"}
        aria-expanded={isOpen}
      >
        <Settings className={`h-6 w-6 ${isOpen ? "animate-spin" : ""}`} />
      </button>
    </>
  );
}
