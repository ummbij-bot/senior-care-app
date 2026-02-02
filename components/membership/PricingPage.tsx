"use client";

import { useState } from "react";
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
import { useMembership } from "@/lib/hooks/useMembership";
import { PRICING } from "@/lib/membership";

type Props = {
  userId: string;
};

const features = [
  {
    icon: Pill,
    name: "복약 알림",
    free: "1개",
    premium: "무제한",
  },
  {
    icon: Music,
    name: "트로트 곡",
    free: "3곡",
    premium: "무제한",
  },
  {
    icon: BookOpen,
    name: "영어 학습",
    free: "1일 1회",
    premium: "무제한",
  },
  {
    icon: MapPin,
    name: "실시간 위치 공유",
    free: null,
    premium: "자녀와 공유",
  },
  {
    icon: ShieldCheck,
    name: "전담 관제센터",
    free: null,
    premium: "24시간 연결",
  },
  {
    icon: Activity,
    name: "보호자 대시보드",
    free: null,
    premium: "실시간 모니터링",
  },
  {
    icon: Clock,
    name: "복약 이력 조회",
    free: "최근 7일",
    premium: "무제한",
  },
];

export default function PricingPage({ userId }: Props) {
  const { isPremium, loading, expiresAt } = useMembership(userId);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = PRICING[selectedPlan];

  // Toss Payments 결제 시작
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const orderId = `order_${userId.slice(0, 8)}_${Date.now()}`;
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!clientKey) {
        alert("결제 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.");
        setIsProcessing(false);
        return;
      }

      // Toss Payments SDK 동적 로드
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: userId });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: plan.amount },
        orderId,
        orderName: `시니어케어 프리미엄 (${selectedPlan === "yearly" ? "연간" : "월간"})`,
        successUrl: `${window.location.origin}/payment/success?userId=${userId}&interval=${selectedPlan}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== "USER_CANCEL") {
        console.error("결제 오류:", error);
        alert(error.message ?? "결제 중 오류가 발생했습니다");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-12 w-12 animate-pulse rounded-full bg-surface" />
      </div>
    );
  }

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
        {/* 이미 프리미엄인 경우 */}
        {isPremium ? (
          <div className="card border-2 border-amber-300 bg-amber-50 py-10 text-center">
            <Crown className="mx-auto h-16 w-16 text-amber-500" strokeWidth={1.8} />
            <h2 className="mt-4 text-3xl font-bold text-text-primary">
              프리미엄 회원이에요
            </h2>
            <p className="mt-2 text-lg text-text-secondary">
              모든 기능을 자유롭게 사용하세요
            </p>
            {expiresAt && (
              <p className="mt-3 text-base text-text-muted">
                {expiresAt.getFullYear()}년 {expiresAt.getMonth() + 1}월{" "}
                {expiresAt.getDate()}일까지
              </p>
            )}
          </div>
        ) : (
          <>
            {/* 히어로 */}
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <Crown className="h-10 w-10 text-amber-500" strokeWidth={2} />
              </div>
              <h2 className="mt-4 text-3xl font-bold text-text-primary">
                프리미엄으로
                <br />
                더 안심하세요
              </h2>
              <p className="mt-2 text-lg text-text-secondary">
                어르신의 안전을 위한 모든 기능
              </p>
            </div>

            {/* 플랜 선택 */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`card text-center ${
                  selectedPlan === "monthly"
                    ? "border-2 border-primary bg-blue-50"
                    : "border-2 border-border"
                }`}
              >
                <p className="text-lg font-bold text-text-primary">월간</p>
                <p className="mt-1 text-2xl font-bold text-primary">9,900원</p>
                <p className="text-sm text-text-muted">/월</p>
              </button>

              <button
                onClick={() => setSelectedPlan("yearly")}
                className={`card relative text-center ${
                  selectedPlan === "yearly"
                    ? "border-2 border-primary bg-blue-50"
                    : "border-2 border-border"
                }`}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-danger px-3 py-0.5 text-xs font-bold text-danger-foreground">
                  17% 할인
                </span>
                <p className="text-lg font-bold text-text-primary">연간</p>
                <p className="mt-1 text-2xl font-bold text-primary">99,000원</p>
                <p className="text-sm text-text-muted">월 8,250원</p>
              </button>
            </div>
          </>
        )}

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

        {/* 결제 버튼 */}
        {!isPremium && (
          <div className="mt-8 pb-10">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn btn-primary btn-lg w-full text-xl"
            >
              {isProcessing ? (
                "결제 진행 중..."
              ) : (
                <>
                  <Crown className="mr-2 h-6 w-6" />
                  {plan.label} 시작하기
                </>
              )}
            </button>
            <p className="mt-3 text-center text-base text-text-muted">
              언제든 해지 가능 · 7일 무료 체험
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
