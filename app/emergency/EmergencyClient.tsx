"use client";

import { Phone, ArrowLeft, AlertTriangle, Heart, Flame, Volume2, MapPin } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { trackEmergencyCall } from "@/lib/analytics";

type Props = {
  guardianPhone: string | null;
  guardianPushSubscription?: string | null; // JSON string of PushSubscription
};

/**
 * TTS 음성 출력 함수
 */
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

/**
 * 햅틱 피드백 함수
 */
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * GPS 위치를 가져와서 Google Maps 링크 생성
 */
function getLocationLink(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        resolve(link);
      },
      () => {
        // 위치 가져오기 실패 (권한 거부 등)
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * 보호자에게 위치 포함 긴급 알림 전송 (SMS API)
 */
async function sendLocationToGuardian(
  guardianPhone: string,
  locationLink: string | null
) {
  try {
    const message = locationLink
      ? `[시니어케어 긴급] 어르신이 긴급 신고를 하셨습니다. 현재 위치: ${locationLink}`
      : `[시니어케어 긴급] 어르신이 긴급 신고를 하셨습니다. 위치를 확인할 수 없습니다. 즉시 연락해 주세요.`;

    // 서버 API를 통해 SMS 전송 (rate limiting 포함)
    await fetch("/api/emergency-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: guardianPhone,
        message,
        locationLink,
      }),
    });
  } catch (err) {
    console.error("[Emergency] 보호자 알림 전송 실패:", err);
  }
}

/**
 * 긴급 신고 클라이언트 컴포넌트
 * - 119, 112, 보호자 번호 큰 버튼
 * - 실수 방지를 위한 2단계 확인 (5초 카운트다운)
 * - TTS 음성 안내 + 햅틱 피드백
 * - GPS 위치 공유 (보호자에게 실시간 지도 링크 전송)
 */
export default function EmergencyClient({ guardianPhone }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [locationLink, setLocationLink] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // 페이지 진입 시 바로 GPS 위치 미리 확보
  useEffect(() => {
    setGpsLoading(true);
    getLocationLink().then((link) => {
      setLocationLink(link);
      setGpsLoading(false);
    });
  }, []);

  const emergencyNumbers = useMemo(
    () => [
      {
        id: "119",
        label: "119",
        description: "화재 · 구급 · 구조",
        voiceGuide: "119 구급대에 전화합니다. 한번 더 누르세요.",
        icon: Flame,
        color: "bg-red-500",
        tel: "tel:119",
      },
      {
        id: "112",
        label: "112",
        description: "경찰 신고",
        voiceGuide: "112 경찰에 전화합니다. 한번 더 누르세요.",
        icon: AlertTriangle,
        color: "bg-blue-600",
        tel: "tel:112",
      },
      {
        id: "family",
        label: "보호자",
        description: guardianPhone
          ? `등록된 가족 (${guardianPhone})`
          : "보호자가 등록되지 않았습니다",
        voiceGuide: "보호자에게 전화합니다. 한번 더 누르세요.",
        icon: Heart,
        color: "bg-emerald-500",
        tel: guardianPhone ? `tel:${guardianPhone}` : null,
        disabled: !guardianPhone,
      },
    ],
    [guardianPhone]
  );

  // 카운트다운 타이머
  useEffect(() => {
    if (!confirmingId) {
      setCountdown(5);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setConfirmingId(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [confirmingId]);

  // 전화 걸기 처리
  const handleCall = useCallback(
    async (id: string, tel: string | null, voiceGuide: string) => {
      if (!tel) return;

      if (confirmingId === id) {
        // 두 번째 클릭: 실제 전화
        vibrate([50, 50, 50]);
        speak("전화를 겁니다.");

        // GA4 이벤트 추적
        trackEmergencyCall(id as "119" | "112" | "guardian");

        // GPS 위치를 보호자에게 전송 (모든 긴급 전화 시)
        if (guardianPhone) {
          // 최신 위치 다시 확보
          const freshLocation = await getLocationLink();
          const finalLocation = freshLocation || locationLink;
          sendLocationToGuardian(guardianPhone, finalLocation);
        }

        // 짧은 딜레이 후 전화 (TTS가 시작할 시간)
        setTimeout(() => {
          window.location.href = tel;
        }, 500);

        setConfirmingId(null);
      } else {
        // 첫 번째 클릭: 확인 요청
        vibrate(100);
        speak(voiceGuide);
        setConfirmingId(id);
        setCountdown(5);
      }
    },
    [confirmingId, guardianPhone, locationLink]
  );

  // 취소 처리
  const handleCancel = useCallback(() => {
    setConfirmingId(null);
    speak("취소되었습니다.");
    vibrate(30);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="flex items-center gap-3 border-b-2 border-red-200 bg-red-50 px-5 pt-6 pb-4 sm:px-8">
        <a
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-red-100"
          aria-label="홈으로"
        >
          <ArrowLeft className="h-6 w-6 text-danger" strokeWidth={2.2} />
        </a>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-danger">긴급 신고</h1>
          <p className="text-base text-danger/70">도움이 필요할 때 누르세요</p>
        </div>
        {/* 음성 안내 아이콘 */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Volume2 className="h-5 w-5 text-danger" />
        </div>
      </header>

      {/* 안내 메시지 */}
      <div className="px-5 pt-6 sm:px-8">
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-lg font-semibold text-amber-800">
            버튼을 두 번 누르면 전화가 걸립니다
          </p>
          <p className="mt-1 text-base text-amber-700">
            음성으로 안내해 드립니다
          </p>
        </div>

        {/* GPS 상태 표시 */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <MapPin className={`h-4 w-4 ${locationLink ? "text-emerald-500" : gpsLoading ? "text-amber-500 animate-pulse" : "text-text-muted"}`} />
          <span className="text-sm text-text-secondary">
            {locationLink
              ? "위치 확보 완료 — 긴급 시 보호자에게 전송됩니다"
              : gpsLoading
                ? "위치 확인 중..."
                : "위치를 확인할 수 없습니다"}
          </span>
        </div>
      </div>

      {/* 긴급 번호 버튼들 */}
      <main className="flex-1 px-5 py-6 sm:px-8">
        <div className="space-y-4">
          {emergencyNumbers.map((item) => {
            const Icon = item.icon;
            const isConfirming = confirmingId === item.id;
            const isDisabled = "disabled" in item && item.disabled;

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleCall(item.id, item.tel, item.voiceGuide)}
                  disabled={isDisabled}
                  className={`
                    flex w-full items-center gap-5 rounded-2xl border-3 p-6
                    transition-all duration-200
                    ${
                      isDisabled
                        ? "border-border bg-surface opacity-50 cursor-not-allowed"
                        : isConfirming
                          ? "border-danger bg-red-100 scale-[1.02] shadow-lg"
                          : "border-border bg-surface-raised hover:border-danger hover:bg-red-50 active:scale-95"
                    }
                  `}
                  aria-label={`${item.label} ${item.description}${isConfirming ? ` - ${countdown}초 안에 한번 더 누르면 전화합니다` : ""}`}
                >
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${item.color} ${isDisabled ? "opacity-50" : ""} ${isConfirming ? "animate-pulse" : ""}`}
                  >
                    {isConfirming ? (
                      <Phone
                        className="h-10 w-10 text-white animate-bounce"
                        strokeWidth={2.2}
                      />
                    ) : (
                      <Icon className="h-10 w-10 text-white" strokeWidth={2.2} />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <p className="text-3xl font-bold text-text-primary">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg text-text-secondary">
                      {isConfirming
                        ? "한번 더 누르면 전화합니다"
                        : item.description}
                    </p>
                  </div>

                  {/* 카운트다운 또는 전화 아이콘 */}
                  {isConfirming ? (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                      <span className="text-2xl font-bold">{countdown}</span>
                    </div>
                  ) : (
                    <Phone
                      className="h-8 w-8 shrink-0 text-text-muted"
                      strokeWidth={2}
                    />
                  )}
                </button>

                {/* 취소 버튼 (확인 중일 때만) */}
                {isConfirming && (
                  <button
                    onClick={handleCancel}
                    className="mt-2 w-full rounded-xl border-2 border-border bg-surface py-3 text-lg font-semibold text-text-secondary hover:bg-surface-raised active:scale-95"
                  >
                    취소
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 하단 안내 */}
      <footer className="border-t border-border bg-surface px-5 py-4 text-center sm:px-8">
        <p className="text-base text-text-muted">
          위급한 상황이 아니면 일반 상담 전화를 이용해 주세요
        </p>
      </footer>
    </div>
  );
}
