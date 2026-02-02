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
}
