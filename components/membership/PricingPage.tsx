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
  Loader2,
  CreditCard,
} from "lucide-react";
import { useMembership } from "@/lib/hooks/useMembership";
import { PRICING } from "@/lib/membership";

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
 * 프리미엄 멤버십 가격 페이지
 *
 * - 월간/연간 플랜 선택
 * - Toss Payments 결제
 * - 기능 비교 테이블
 *
 * [전면 무료화 롤백 방법]
 * 이 함수 전체를 "모든 기능 무료" 표시 버전으로 교체
 */
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
        alert("결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.");
        setIsProcessing(false);
        return;
      }

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
        alert(error.message ?? "결제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

      <main className="flex-1 px-5 pb-8 sm:px-8">
        {/* 히어로 섹션 */}
        {isPremium ? (
          // 프리미엄 사용자
          <div className="card border-2 border-emerald-300 bg-emerald-50 py-8 text-center">
            <Crown className="mx-auto h-14 w-14 text-emerald-500" strokeWidth={1.8} />
            <h2 className="mt-3 text-2xl font-bold text-text-primary">
              프리미엄 회원이에요
            </h2>
            {expiresAt && (
              <p className="mt-2 text-base text-text-secondary">
                {expiresAt.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                까지 이용 가능
              </p>
            )}
          </div>
        ) : (
          // 무료 사용자 → 업그레이드 유도
          <div className="card border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100 py-8 text-center">
            <Crown className="mx-auto h-14 w-14 text-amber-500" strokeWidth={1.8} />
            <h2 className="mt-3 text-2xl font-bold text-text-primary">
              프리미엄으로 업그레이드
            </h2>
            <p className="mt-2 text-lg text-text-secondary">
              모든 기능을 제한 없이 사용하세요
            </p>
          </div>
        )}

        {/* 플랜 선택 (무료 사용자만) */}
        {!isPremium && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* 월간 */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`rounded-2xl border-3 p-5 text-left transition-all active:scale-95 ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-raised hover:border-primary/50"
              }`}
            >
              <p className="text-lg font-bold text-text-primary">월간</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {PRICING.monthly.amount.toLocaleString()}원
              </p>
              <p className="text-sm text-text-muted">매월 결제</p>
            </button>

            {/* 연간 */}
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`relative rounded-2xl border-3 p-5 text-left transition-all active:scale-95 ${
                selectedPlan === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-raised hover:border-primary/50"
              }`}
            >
              <span className="absolute -top-2.5 right-3 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                17% 할인
              </span>
              <p className="text-lg font-bold text-text-primary">연간</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {PRICING.yearly.amount.toLocaleString()}원
              </p>
              <p className="text-sm text-text-muted">월 8,250원</p>
            </button>
          </div>
        )}

        {/* 결제 버튼 (무료 사용자만) */}
        {!isPremium && (
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="btn btn-primary btn-lg mt-6 w-full flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                결제 준비 중...
              </>
            ) : (
              <>
                <CreditCard className="h-6 w-6" />
                {plan.label}로 시작하기
              </>
            )}
          </button>
        )}

        {/* 기능 비교 테이블 */}
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-bold text-text-primary">기능 비교</h3>

          {/* 테이블 헤더 */}
          <div className="flex items-center gap-3 px-4 pb-2 text-sm text-text-muted">
            <span className="flex-1">기능</span>
            <span className="w-16 text-center">무료</span>
            <span className="w-20 text-center font-semibold text-amber-600">프리미엄</span>
          </div>

          {/* 기능 목록 */}
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
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-base text-text-muted">
          <p>결제 후 즉시 프리미엄 기능을 사용할 수 있어요</p>
          <p className="mt-1">언제든 해지 가능 · 환불 정책 적용</p>
        </div>
      </main>
    </div>
  );
}
