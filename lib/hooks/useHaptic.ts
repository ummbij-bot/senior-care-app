"use client";

import { useCallback } from "react";

/**
 * 햅틱 피드백 훅
 *
 * 주요 버튼 클릭 시 짧은 진동으로 촉각 피드백 제공.
 * 시니어 사용자가 터치 입력을 확실히 인식할 수 있도록 함.
 *
 * @example
 * const { tap, success, warning } = useHaptic();
 * <button onClick={() => { tap(); doSomething(); }}>버튼</button>
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // vibrate 미지원 환경 (iOS 등) 무시
      }
    }
  }, []);

  /** 일반 탭 피드백 (15ms) */
  const tap = useCallback(() => vibrate(15), [vibrate]);

  /** 성공 피드백 (짧은 2회) */
  const success = useCallback(() => vibrate([15, 50, 15]), [vibrate]);

  /** 경고 피드백 (긴 진동) */
  const warning = useCallback(() => vibrate(100), [vibrate]);

  /** 긴급 피드백 (연속 3회) */
  const emergency = useCallback(() => vibrate([50, 50, 50, 50, 50]), [vibrate]);

  return { tap, success, warning, emergency, vibrate };
}
