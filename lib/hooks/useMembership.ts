"use client";

import { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase-client";
import type { MembershipTier } from "@/lib/membership";

type MembershipInfo = {
  tier: MembershipTier;
  expiresAt: Date | null;
  isExpired: boolean;
  isPremium: boolean;
};

/**
 * 사용자 멤버십 상태 훅
 *
 * [전면 무료화 모드]
 * 실제 DB 조회 로직을 주석 처리하고 항상 premium 반환.
 * 나중에 과금 복원 시 아래 주석만 해제하면 됨.
 */
export function useMembership(userId: string) {
  // ── 전면 무료화: 항상 premium ──
  const [membership] = useState<MembershipInfo>({
    tier: "premium",
    expiresAt: null,
    isExpired: false,
    isPremium: true,
  });
  const [loading] = useState(false);

  // 사용하지 않는 파라미터 경고 방지
  void userId;

  return { ...membership, loading };

  /* ── [과금 복원 시 아래 블록 주석 해제, 위 블록 삭제] ──
  const [membership, setMembership] = useState<MembershipInfo>({
    tier: "free",
    expiresAt: null,
    isExpired: false,
    isPremium: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, membership_expires_at")
        .eq("id", userId)
        .single();

      if (data) {
        const tier = (data.membership_tier ?? "free") as MembershipTier;
        const expiresAt = data.membership_expires_at
          ? new Date(data.membership_expires_at)
          : null;
        const isExpired = expiresAt ? expiresAt < new Date() : false;
        const effectiveTier = isExpired ? "free" : tier;

        setMembership({
          tier: effectiveTier,
          expiresAt,
          isExpired,
          isPremium: effectiveTier === "premium",
        });
      }
      setLoading(false);
    }
    fetch();
  }, [userId]);

  return { ...membership, loading };
  */
}
