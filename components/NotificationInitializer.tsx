"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { registerServiceWorker, subscribeToPush } from "@/lib/notifications";

type Props = {
  userId: string;
};

/**
 * 알림 권한 요청 + Service Worker 초기화 컴포넌트
 * - 앱 최초 방문 시 알림 권한 요청 배너 표시
 * - 이미 허용된 경우 자동으로 SW 등록
 */
export default function NotificationInitializer({ userId }: Props) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      // 이미 허용 → SW만 등록
      registerServiceWorker();
    } else if (Notification.permission === "default") {
      // 아직 결정 안함 → 배너 표시
      setShowBanner(true);
    }
  }, []);

  const handleAllow = async () => {
    const subscription = await subscribeToPush(userId);
    if (subscription) {
      setPermission("granted");
    } else {
      setPermission(Notification.permission);
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-blue-50 px-5 py-4 sm:px-8"
      role="alert"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
          {permission === "denied" ? (
            <BellOff className="h-6 w-6 text-primary-foreground" />
          ) : (
            <Bell className="h-6 w-6 text-primary-foreground" />
          )}
        </div>

        <div className="flex-1">
          <p className="text-lg font-bold text-text-primary">
            약 먹을 시간을 알려드릴까요?
          </p>
          <p className="text-base text-text-secondary">
            알림을 허용하면 복약 시간에 알려드립니다
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button onClick={handleAllow} className="btn btn-primary">
            허용하기
          </button>
          <button onClick={handleDismiss} className="btn btn-outline">
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
