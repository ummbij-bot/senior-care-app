"use client";

import { supabase } from "@/lib/supabase-client";

/* ============================================
   Web Push 알림 시스템

   흐름:
   1. Service Worker 등록
   2. Push 알림 권한 요청
   3. 구독 정보를 Supabase profiles에 저장
   4. 복약 시간에 맞춰 로컬 스케줄러가 알림 트리거
   ============================================ */

// VAPID Public Key (Supabase Edge Function과 공유)
// TODO: 실제 키로 교체 필요 — npx web-push generate-vapid-keys 로 생성
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Service Worker 등록
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service Worker 미지원 브라우저");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[Push] Service Worker 등록 완료");
    return registration;
  } catch (err) {
    console.error("[Push] Service Worker 등록 실패:", err);
    return null;
  }
}

/**
 * Push 알림 권한 요청 + 구독
 */
export async function subscribeToPush(
  userId: string
): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  // 권한 확인
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("[Push] 알림 권한 거부됨");
    return null;
  }

  try {
    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription && VAPID_PUBLIC_KEY) {
      // 새 구독 생성
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (subscription) {
      // Supabase에 구독 정보 저장
      await supabase
        .from("profiles")
        .update({
          push_subscription: JSON.stringify(subscription.toJSON()),
        })
        .eq("id", userId);

      console.log("[Push] 구독 완료 및 서버 저장");
    }

    return subscription;
  } catch (err) {
    console.error("[Push] 구독 실패:", err);
    return null;
  }
}

/**
 * 로컬 복약 알림 스케줄러
 * - 브라우저가 열려 있을 때 작동
 * - 서버 Push와 이중 안전망 역할
 */
export function scheduleLocalNotification(
  scheduledTime: string, // "08:00"
  medicationName: string,
  logId: string
): number | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const now = new Date();
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  // 이미 지난 시간이면 무시
  if (target <= now) return null;

  const delay = target.getTime() - now.getTime();

  const timerId = window.setTimeout(() => {
    // Service Worker를 통한 알림 표시
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("복약 알림", {
        body: `${medicationName} 드실 시간이에요`,
        icon: "/pill-icon.png",
        tag: `med-${logId}`,
        requireInteraction: true,
        data: { url: "/medication", logId },
      } as NotificationOptions);
    });
  }, delay);

  return timerId;
}

/* ── 유틸리티 ── */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
