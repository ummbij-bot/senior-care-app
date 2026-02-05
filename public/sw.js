/// <reference lib="webworker" />

/* ============================================
   Service Worker - 시니어 케어 앱 v2.0

   역할:
   1. Web Push 수신 → 알림 표시
   2. 알림 클릭 → 복약 페이지로 이동
   3. 백그라운드에서도 알림 수신 가능
   4. 오프라인 지원: 복약 리스트, 긴급 신고 등 핵심 페이지 캐시
   ============================================ */

const SW_VERSION = "2.0.0";

const CACHE_NAME = `senior-care-v${SW_VERSION}`;

// 프리캐싱할 핵심 페이지 (오프라인에서도 반드시 동작해야 하는 것들)
const PRECACHE_ASSETS = [
  "/",
  "/medication",
  "/emergency",
  "/entertainment",
  "/morning",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

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
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
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
  } else if (event.action === "snooze") {
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
        }, 10 * 60 * 1000);
      })
    );
  } else {
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

// ── 설치: 핵심 페이지 프리캐싱 ──
self.addEventListener("install", (event) => {
  console.log(`[SW] 설치 완료 v${SW_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── 활성화: 오래된 캐시 삭제 ──
self.addEventListener("activate", (event) => {
  console.log(`[SW] 활성화 v${SW_VERSION}`);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: 캐싱 전략 ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 다른 origin이나 API 요청 → 네트워크 직통
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // ── 전략 1: 정적 자산 → Cache First (캐시 우선) ──
  if (
    request.destination === "image" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // 오프라인이고 캐시도 없으면 그냥 빈 응답
          return new Response("", { status: 503 });
        });
      })
    );
    return;
  }

  // ── 전략 2: HTML 페이지 → Network First (네트워크 우선) ──
  // 온라인이면 최신 버전 제공, 오프라인이면 캐시에서 제공
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // 성공하면 캐시에 저장 (다음 오프라인 대비)
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // 오프라인 → 캐시에서 해당 페이지 찾기
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // 해당 페이지 캐시도 없으면 홈 페이지(/)라도 보여주기
            return caches.match("/").then((homeCached) => {
              if (homeCached) return homeCached;
              // 최후의 수단: 오프라인 안내 HTML
              return new Response(
                `<!DOCTYPE html>
                <html lang="ko">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                <title>오프라인</title>
                <style>
                  body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf8f5; color: #1c1917; text-align: center; padding: 2rem; }
                  h1 { font-size: 2rem; margin-bottom: 1rem; }
                  p { font-size: 1.25rem; color: #44403c; line-height: 1.6; }
                  button { margin-top: 2rem; padding: 1rem 2rem; font-size: 1.25rem; font-weight: 700; background: #2563b0; color: #fff; border: none; border-radius: 12px; cursor: pointer; min-height: 50px; }
                </style>
                </head>
                <body>
                  <div>
                    <h1>인터넷 연결이 끊겼어요</h1>
                    <p>Wi-Fi나 데이터를 확인해 주세요.<br>연결되면 자동으로 돌아옵니다.</p>
                    <button onclick="location.reload()">다시 시도</button>
                  </div>
                </body>
                </html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
              );
            });
          });
        })
    );
    return;
  }
});
