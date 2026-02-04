"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

/**
 * PWA 설치 안내 + Service Worker 등록 컴포넌트
 * - SW 자동 등록
 * - "홈 화면에 추가" 배너 (시니어 친화적 큰 글씨)
 * - beforeinstallprompt 이벤트 처리
 */
export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Service Worker 등록
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] SW 등록 성공:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] SW 등록 실패:", err);
        });
    }

    // 설치 프롬프트 이벤트 캡처
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // 이전에 닫은 적 없으면 배너 표시
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promptEvent = deferredPrompt as any;
    promptEvent.prompt();

    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") {
      console.log("[PWA] 설치 완료");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary/30 bg-surface-raised px-5 py-4 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Download className="h-6 w-6 text-primary" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-text-primary">
            홈 화면에 추가하세요
          </p>
          <p className="text-base text-text-secondary">
            앱처럼 바로 열 수 있어요
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="rounded-xl bg-primary px-5 py-3 text-lg font-bold text-primary-foreground active:scale-95"
          >
            설치
          </button>
          <button
            onClick={handleDismiss}
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface active:scale-95"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-text-muted" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
