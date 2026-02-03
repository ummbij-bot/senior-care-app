"use client";

import { Phone, ArrowLeft, AlertTriangle, Heart, Flame } from "lucide-react";
import { useState } from "react";

const EMERGENCY_NUMBERS = [
  {
    id: "119",
    label: "119",
    description: "화재 · 구급 · 구조",
    icon: Flame,
    color: "bg-red-500",
    tel: "tel:119",
  },
  {
    id: "112",
    label: "112",
    description: "경찰 신고",
    icon: AlertTriangle,
    color: "bg-blue-600",
    tel: "tel:112",
  },
  {
    id: "family",
    label: "보호자",
    description: "등록된 가족에게 전화",
    icon: Heart,
    color: "bg-emerald-500",
    tel: "tel:010-1234-5678", // TODO: 실제 보호자 번호로 교체
  },
];

/**
 * 긴급 신고 페이지
 * - 119, 112, 보호자 번호 큰 버튼
 * - 실수 방지를 위한 확인 단계
 */
export default function EmergencyPage() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCall = (id: string, tel: string) => {
    if (confirmingId === id) {
      // 두 번째 클릭: 실제 전화
      window.location.href = tel;
      setConfirmingId(null);
    } else {
      // 첫 번째 클릭: 확인 요청
      setConfirmingId(id);
      // 5초 후 확인 상태 해제
      setTimeout(() => setConfirmingId(null), 5000);
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-danger">긴급 신고</h1>
          <p className="text-base text-danger/70">도움이 필요할 때 누르세요</p>
        </div>
      </header>

      {/* 안내 메시지 */}
      <div className="px-5 pt-6 sm:px-8">
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-lg font-semibold text-amber-800">
            ⚠️ 버튼을 두 번 누르면 전화가 걸립니다
          </p>
          <p className="mt-1 text-base text-amber-700">
            실수로 누르셨다면 5초 후 자동 취소됩니다
          </p>
        </div>
      </div>

      {/* 긴급 번호 버튼들 */}
      <main className="flex-1 px-5 py-6 sm:px-8">
        <div className="space-y-4">
          {EMERGENCY_NUMBERS.map((item) => {
            const Icon = item.icon;
            const isConfirming = confirmingId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleCall(item.id, item.tel)}
                className={`
                  flex w-full items-center gap-5 rounded-2xl border-3 p-6
                  active:scale-95
                  ${
                    isConfirming
                      ? "border-danger bg-red-100 animate-pulse"
                      : "border-border bg-surface-raised hover:border-danger hover:bg-red-50"
                  }
                `}
                aria-label={`${item.label} ${item.description}${isConfirming ? " - 한번 더 누르면 전화합니다" : ""}`}
              >
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${item.color}`}
                >
                  {isConfirming ? (
                    <Phone className="h-10 w-10 text-white animate-bounce" strokeWidth={2.2} />
                  ) : (
                    <Icon className="h-10 w-10 text-white" strokeWidth={2.2} />
                  )}
                </div>

                <div className="flex-1 text-left">
                  <p className="text-3xl font-bold text-text-primary">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg text-text-secondary">
                    {isConfirming ? "한번 더 누르면 전화합니다" : item.description}
                  </p>
                </div>

                <Phone
                  className={`h-8 w-8 shrink-0 ${isConfirming ? "text-danger" : "text-text-muted"}`}
                  strokeWidth={2}
                />
              </button>
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
