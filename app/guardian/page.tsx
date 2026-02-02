import GuardianDashboard from "@/components/guardian/GuardianDashboard";
import { requirePremium } from "@/lib/check-membership-server";

/**
 * /guardian 페이지 - 보호자 대시보드 (프리미엄 전용)
 *
 * 서버 컴포넌트에서 멤버십 체크 → 무료 사용자는 /pricing으로 리다이렉트
 */
export default async function GuardianPage({
  searchParams,
}: {
  searchParams: Promise<{ senior?: string; user?: string }>;
}) {
  const params = await searchParams;
  const seniorId = params.senior ?? "4b2d8b80-222d-4783-a683-f1e96f1dbac3";
  const userId = params.user ?? seniorId;

  // 프리미엄 멤버십 확인 (무료 → /pricing 리다이렉트)
  await requirePremium(userId);

  return <GuardianDashboard seniorId={seniorId} />;
}
