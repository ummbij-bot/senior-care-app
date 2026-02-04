"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
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
 * Supabase profiles 테이블에서 멤버십 정보를 조회하여
 * 현재 사용자가 프리미엄인지 무료인지 반환합니다.
 *
 * [전면 무료화 롤백 방법]
 * 이 파일 전체를 아래 코드로 교체:
 * ```
 * export function useMembership(userId: string) {
 *   void userId;
 *   return { tier: "premium", expiresAt: null, isExpired: false, isPremium: true, loading: false };
 * }
 * ```
 */
export function useMembership(userId: string) {
  const [membership, setMembership] = useState<MembershipInfo>({
    tier: "free",
    expiresAt: null,
    isExpired: false,
    isPremium: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembership() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("membership_tier, membership_expires_at")
          .eq("id", userId)
          .single();

        if (error) {
          console.warn("멤버십 조회 오류:", error.message);
          setLoading(false);
          return;
        }

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
      } catch (err) {
        console.error("멤버십 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchMembership();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return { ...membership, loading };
}
