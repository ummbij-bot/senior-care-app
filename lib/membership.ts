import { supabase } from "@/lib/supabase-client";

/* ============================================
   멤버십 시스템 코어 유틸리티

   Tier:
   - free: 기본 무료 (제한적 기능)
   - premium: 월 9,900원 / 연 99,000원
   ============================================ */

export type MembershipTier = "free" | "premium";

export type FeatureKey =
  | "medication_alerts"
  | "trot_songs"
  | "english_lessons"
  | "realtime_location"
  | "emergency_center"
  | "guardian_dashboard"
  | "unlimited_history";

export const PRICING = {
  monthly: { amount: 9900, label: "월 9,900원", interval: "monthly" as const },
  yearly: { amount: 99000, label: "연 99,000원 (월 8,250원)", interval: "yearly" as const },
} as const;

/**
 * 사용자의 현재 멤버십 정보 조회
 */
export async function getUserMembership(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("membership_tier, membership_expires_at")
    .eq("id", userId)
    .single();

  if (!data) return { tier: "free" as MembershipTier, isExpired: false };

  const tier = (data.membership_tier ?? "free") as MembershipTier;
  const expiresAt = data.membership_expires_at
    ? new Date(data.membership_expires_at)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  return {
    tier: isExpired ? ("free" as MembershipTier) : tier,
    expiresAt,
    isExpired,
  };
}

/**
 * 특정 기능의 사용 가능 여부 확인
 * - free_limit = 0 → 무료에서 비활성
 * - free_limit = null → 무제한
 * - premium_limit = null → 무제한
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; limit: number | null; tier: MembershipTier }> {
  const membership = await getUserMembership(userId);

  const { data: gate } = await supabase
    .from("feature_gates")
    .select("free_limit, premium_limit")
    .eq("feature_key", featureKey)
    .single();

  if (!gate) return { allowed: true, limit: null, tier: membership.tier };

  if (membership.tier === "premium") {
    return { allowed: true, limit: gate.premium_limit, tier: "premium" };
  }

  // 무료 사용자
  const freeLimit = gate.free_limit;
  return {
    allowed: freeLimit !== 0 && freeLimit !== null ? true : freeLimit === null,
    limit: freeLimit,
    tier: "free",
  };
}

/**
 * 프리미엄 기능인지 빠른 체크 (UI에서 잠금 아이콘 표시용)
 */
export function isPremiumFeature(featureKey: FeatureKey): boolean {
  const premiumOnly: FeatureKey[] = [
    "realtime_location",
    "emergency_center",
    "guardian_dashboard",
  ];
  return premiumOnly.includes(featureKey);
}
