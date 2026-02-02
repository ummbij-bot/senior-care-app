import MedicationDashboard from "@/components/medication/MedicationDashboard";

/**
 * /medication 페이지
 *
 * TODO: 실제 인증 연동 후 userId를 세션에서 가져올 것
 * 현재는 테스트용으로 URL 파라미터 또는 하드코딩 사용
 */
export default async function MedicationPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const params = await searchParams;

  // 테스트용: ?user=UUID 또는 기본값
  // 프로덕션에서는 인증 세션에서 가져옴
  const userId = params.user ?? "4b2d8b80-222d-4783-a683-f1e96f1dbac3";
  const userName = "홍길동";

  return <MedicationDashboard userId={userId} userName={userName} />;
}
