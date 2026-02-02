"use client";

import { Crown, User } from "lucide-react";
import { useMembership } from "@/lib/hooks/useMembership";

type Props = {
  userId: string;
};

/**
 * 멤버십 배지 (대시보드 헤더에 표시)
 */
export default function MembershipBadge({ userId }: Props) {
  const { isPremium, loading, expiresAt } = useMembership(userId);

  if (loading) return null;

  if (isPremium) {
    const expiresLabel = expiresAt
      ? `${expiresAt.getMonth() + 1}/${expiresAt.getDate()}까지`
      : "";

    return (
      <a
        href="/pricing"
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800"
      >
        <Crown className="h-4 w-4" strokeWidth={2.5} />
        프리미엄 {expiresLabel}
      </a>
    );
  }

  return (
    <a
      href="/pricing"
      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600"
    >
      <User className="h-4 w-4" strokeWidth={2.5} />
      무료 회원
    </a>
  );
}
