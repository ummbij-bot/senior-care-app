"use client";

import { Lock, Crown } from "lucide-react";
import { useMembership } from "@/lib/hooks/useMembership";

type Props = {
  userId: string;
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * 프리미엄 기능 게이트
 *
 * 프리미엄 사용자는 children을 렌더링하고,
 * 무료 사용자는 잠금 화면(업그레이드 유도)을 표시합니다.
 *
 * [전면 무료화 롤백 방법]
 * 이 파일 전체를 아래 코드로 교체:
 * ```
 * export default function PremiumGate({ children }: Props) {
 *   return <>{children}</>;
 * }
 * ```
 */
export default function PremiumGate({
  userId,
  featureName,
  children,
  fallback,
}: Props) {
  const { isPremium, loading } = useMembership(userId);

  // 로딩 중
  if (loading) {
    return (
      <div className="card animate-pulse py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-surface" />
        <div className="mx-auto mt-4 h-6 w-40 rounded bg-surface" />
      </div>
    );
  }

  // 프리미엄 사용자 → 컨텐츠 표시
  if (isPremium) {
    return <>{children}</>;
  }

  // 무료 사용자 → fallback이 있으면 fallback, 없으면 기본 잠금 화면
  if (fallback) {
    return <>{fallback}</>;
  }

  // 기본 잠금 화면
  return (
    <div className="card border-2 border-amber-300 bg-amber-50 py-10 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-10 w-10 text-amber-600" strokeWidth={2} />
      </div>

      <h3 className="mt-5 text-2xl font-bold text-text-primary">
        프리미엄 기능이에요
      </h3>
      <p className="mt-2 text-lg text-text-secondary">
        <strong>{featureName}</strong> 기능은
        <br />
        프리미엄 회원만 사용할 수 있어요
      </p>

      <a href="/pricing" className="btn btn-primary btn-lg mt-6 inline-flex">
        <Crown className="mr-2 h-6 w-6" />
        프리미엄 시작하기
      </a>

      <p className="mt-3 text-base text-text-muted">
        월 9,900원부터 · 언제든 해지 가능
      </p>
    </div>
  );
}
