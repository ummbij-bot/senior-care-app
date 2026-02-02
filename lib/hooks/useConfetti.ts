"use client";

import { useCallback, useEffect, useRef } from "react";
import type confettiModule from "canvas-confetti";

type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  origin?: { x?: number; y?: number };
};

/**
 * Canvas confetti wrapper hook
 * - 동적 import (SSR 방지)
 * - prefers-reduced-motion 존중
 * - 저사양 기기 배려 (particleCount 조절)
 */
export function useConfetti() {
  const confettiRef = useRef<typeof confettiModule | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }

    import("canvas-confetti").then((mod) => {
      confettiRef.current = mod.default;
    });
  }, []);

  const fire = useCallback((options?: ConfettiOptions) => {
    if (prefersReducedMotion.current) return;
    if (!confettiRef.current) return;

    // 햅틱 피드백 (지원 기기)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }

    confettiRef.current({
      particleCount: 80,
      spread: 70,
      startVelocity: 30,
      decay: 0.9,
      scalar: 1.2,
      origin: { y: 0.6 },
      ...options,
    });
  }, []);

  return { fire };
}
