/**
 * Google Analytics 4 이벤트 추적 유틸리티
 *
 * 환경변수: NEXT_PUBLIC_GA_ID (예: "G-XXXXXXXXXX")
 *
 * 사용법:
 * import { trackEvent } from "@/lib/analytics";
 * trackEvent("emergency_call", { type: "119" });
 */

// GA4 측정 ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

// gtag 타입 정의
type GtagCommand = "config" | "event" | "js";

declare global {
  interface Window {
    gtag?: (command: GtagCommand, target: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

/**
 * GA4 커스텀 이벤트 전송
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  if (window.gtag && GA_ID) {
    window.gtag("event", eventName, params);
  }

  // 개발 모드 로깅
  if (process.env.NODE_ENV === "development") {
    console.log(`[GA4] 이벤트: ${eventName}`, params);
  }
}

/**
 * 미리 정의된 이벤트 함수들
 */

/** 긴급 신고 버튼 클릭 */
export function trackEmergencyCall(type: "119" | "112" | "guardian") {
  trackEvent("emergency_call", {
    call_type: type,
    timestamp: new Date().toISOString(),
  });
}

/** 결제 시작 */
export function trackPaymentStart(plan: string, amount: number) {
  trackEvent("payment_start", {
    plan,
    amount,
    currency: "KRW",
  });
}

/** 결제 완료 */
export function trackPaymentComplete(plan: string, amount: number) {
  trackEvent("purchase", {
    transaction_id: `txn_${Date.now()}`,
    value: amount,
    currency: "KRW",
    items: [{ item_name: plan }],
  });
}

/** 복약 완료 */
export function trackMedicationTaken(medicationName: string) {
  trackEvent("medication_taken", {
    medication_name: medicationName,
  });
}

/** 페이지 진입 */
export function trackPageView(pageName: string) {
  trackEvent("page_view", {
    page_title: pageName,
  });
}
