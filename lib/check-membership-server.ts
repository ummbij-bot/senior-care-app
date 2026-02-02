import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

/**
 * 서버 컴포넌트에서 멤버십 체크 + 리다이렉트
 *
 * 사용법 (서버 컴포넌트 page.tsx에서):
 *   await requirePremium(userId);
 *   // 이 줄에 도달하면 프리미엄 확인 완료
 *
 * Next.js 16에서 middleware 대신 사용
 */
export async function requirePremium(userId: string | undefined) {
  if (!userId) {
    redirect("/pricing");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_tier, membership_expires_at")
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect("/pricing");
  }

  const tier = profile.membership_tier ?? "free";
  const expiresAt = profile.membership_expires_at
    ? new Date(profile.membership_expires_at)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  if (tier === "free" || isExpired) {
    redirect(`/pricing?user=${userId}`);
  }

  return { tier, expiresAt };
}
