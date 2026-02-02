"use client";

import {
  ArrowLeft,
  Crown,
  Check,
  X,
  Pill,
  Music,
  BookOpen,
  MapPin,
  ShieldCheck,
  Activity,
  Clock,
} from "lucide-react";

/*
 * [전면 무료화] 과금 복원 시 아래 import 주석 해제
 * import { useState } from "react";
 * import { useMembership } from "@/lib/hooks/useMembership";
 * import { PRICING } from "@/lib/membership";
 */

type Props = {
  userId: string;
};

const features = [
  { icon: Pill, name: "복약 알림", free: "1개", premium: "무제한" },
  { icon: Music, name: "트로트 곡", free: "3곡", premium: "무제한" },
  { icon: BookOpen, name: "영어 학습", free: "1일 1회", premium: "무제한" },
  { icon: MapPin, name: "실시간 위치 공유", free: null, premium: "자녀와 공유" },
  { icon: ShieldCheck, name: "전담 관제센터", free: null, premium: "24시간 연결" },
  { icon: Activity, name: "보호자 대시보드", free: null, premium: "실시간 모니터링" },
  { icon: Clock, name: "복약 이력 조회", free: "최근 7일", premium: "무제한" },
];

/**
 * [전면 무료화 모드]
 * 결제/플랜 선택 UI를 숨기고, "모든 기능 무료" 안내 + 기능 비교 테이블만 표시.
 * 과금 복원 시: 이 파일 하단의 주석 블록(PricingPagePaid)으로 교체.
 */
export default function PricingPage({ userId }: Props) {
  void userId;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 sm:px-8">
        <a
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
          aria-label="홈으로"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
        </a>
        <h1 className="text-2xl font-bold text-text-primary">멤버십</h1>
      </header>

      <main className="flex-1 px-5 sm:px-8">
        {/* 전면 무료 안내 */}
        <div className="card border-2 border-emerald-300 bg-emerald-50 py-10 text-center">
          <Crown className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={1.8} />
          <h2 className="mt-4 text-3xl font-bold text-text-primary">
            모든 기능이 무료예요
          </h2>
          <p className="mt-2 text-lg text-text-secondary">
            현재 모든 프리미엄 기능을 무료로 사용할 수 있어요
          </p>
        </div>

        {/* 기능 비교 테이블 */}
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-bold text-text-primary">기능 비교</h3>
          <div className="space-y-2">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-4"
                >
                  <Icon className="h-6 w-6 shrink-0 text-text-muted" strokeWidth={2} />
                  <span className="flex-1 text-base font-medium text-text-primary">
                    {feat.name}
                  </span>

                  {/* 무료 */}
                  <span className="w-16 text-center text-sm">
                    {feat.free ? (
                      <span className="text-text-secondary">{feat.free}</span>
                    ) : (
                      <X className="mx-auto h-5 w-5 text-red-400" />
                    )}
                  </span>

                  {/* 프리미엄 */}
                  <span className="w-20 text-center text-sm font-semibold text-primary">
                    {feat.premium === "무제한" ? (
                      <Check className="mx-auto h-5 w-5 text-emerald-500" />
                    ) : (
                      feat.premium
                    )}
                  </span>
                </div>
              );
            })}

            {/* 헤더 라벨 */}
            <div className="flex items-center gap-3 px-4 pt-1 text-xs text-text-muted">
              <span className="flex-1" />
              <span className="w-16 text-center">무료</span>
              <span className="w-20 text-center font-semibold text-amber-600">프리미엄</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/*
 * ══════════════════════════════════════════════════════════════
 * [과금 복원용 코드] - 아래 함수로 위 PricingPage를 교체하면 됨
 * ══════════════════════════════════════════════════════════════
 *
 * export default function PricingPage({ userId }: Props) {
 *   const { isPremium, loading, expiresAt } = useMembership(userId);
 *   const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
 *   const [isProcessing, setIsProcessing] = useState(false);
 *   const plan = PRICING[selectedPlan];
 *
 *   const handlePayment = async () => {
 *     setIsProcessing(true);
 *     try {
 *       const orderId = `order_${userId.slice(0, 8)}_${Date.now()}`;
 *       const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
 *       if (!clientKey) {
 *         alert("결제 설정이 완료되지 않았습니다.");
 *         setIsProcessing(false);
 *         return;
 *       }
 *       const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
 *       const tossPayments = await loadTossPayments(clientKey);
 *       const payment = tossPayments.payment({ customerKey: userId });
 *       await payment.requestPayment({
 *         method: "CARD",
 *         amount: { currency: "KRW", value: plan.amount },
 *         orderId,
 *         orderName: `시니어케어 프리미엄 (${selectedPlan === "yearly" ? "연간" : "월간"})`,
 *         successUrl: `${window.location.origin}/payment/success?userId=${userId}&interval=${selectedPlan}`,
 *         failUrl: `${window.location.origin}/payment/fail`,
 *       });
 *     } catch (err: unknown) {
 *       const error = err as { code?: string; message?: string };
 *       if (error.code !== "USER_CANCEL") {
 *         console.error("결제 오류:", error);
 *         alert(error.message ?? "결제 중 오류가 발생했습니다");
 *       }
 *     } finally {
 *       setIsProcessing(false);
 *     }
 *   };
 *
 *   if (loading) {
 *     return (
 *       <div className="flex min-h-dvh items-center justify-center bg-background">
 *         <div className="h-12 w-12 animate-pulse rounded-full bg-surface" />
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     ... 기존 JSX (프리미엄 여부에 따른 히어로 + 플랜 선택 + 기능 비교 + 결제 버튼)
 *   );
 * }
 */
