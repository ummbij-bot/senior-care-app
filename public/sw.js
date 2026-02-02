/// <reference lib="webworker" />

/* ============================================
   Service Worker - 복약 알림 전용

   역할:
   1. Web Push 수신 → 알림 표시
   2. 알림 클릭 → 복약 페이지로 이동
   3. 백그라운드에서도 알림 수신 가능
   ============================================ */

const SW_VERSION = "1.0.0";

// ── Push 메시지 수신 ──
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "복약 알림",
      body: event.data.text(),
      tag: "medication",
    };
  }

  const options = {
    body: payload.body || "약 드실 시간이에요",
    icon: "/pill-icon.png",
    badge: "/badge-icon.png",
    tag: payload.tag || "medication-reminder",
    renotify: true, // 같은 태그여도 다시 알림
    requireInteraction: true, // 시니어가 직접 닫을 때까지 유지
    vibrate: [300, 100, 300, 100, 300], // 긴 진동 (시니어가 느끼기 쉽게)
    data: {
      url: payload.url || "/medication",
      logId: payload.logId || null,
    },
    actions: [
      {
        action: "take",
        title: "약 먹었어요",
      },
      {
        action: "snooze",
        title: "10분 후 알림",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title || "복약 알림", options));
});

// ── 알림 클릭 처리 ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/medication";

  if (event.action === "take") {
    // '약 먹었어요' 액션 → 복약 페이지로 이동
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        // 이미 열린 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes("/medication") && "focus" in client) {
            return client.focus();
          }
        }
        // 없으면 새 탭
        return self.clients.openWindow(url);
      })
    );
  } else if (event.action === "snooze") {
    // '10분 후 알림' → 10분 후 다시 알림 (간단 구현)
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification("복약 알림", {
            body: "약 드실 시간이에요! (다시 알림)",
            icon: "/pill-icon.png",
            tag: "medication-snooze",
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300],
            data: { url: "/medication" },
          });
          resolve(undefined);
        }, 10 * 60 * 1000); // 10분
      })
    );
  } else {
    // 일반 클릭 → 페이지 이동
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/medication") && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
    );
  }
});

// ── 설치/활성화 ──
self.addEventListener("install", () => {
  console.log(`[SW] 설치 완료 v${SW_VERSION}`);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[SW] 활성화 v${SW_VERSION}`);
  event.waitUntil(self.clients.claim());
});
