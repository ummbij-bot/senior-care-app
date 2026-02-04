import MedicationDashboard from "@/components/medication/MedicationDashboard";
import { getCurrentUserOrDemo } from "@/lib/auth/getCurrentUser";

/**
 * /medication 페이지 (Server Component)
 *
 * Supabase Auth로 현재 로그인한 사용자 정보를 가져와서
 * MedicationDashboard에 전달합니다.
 */
export default async function MedicationPage() {
  // 현재 로그인한 사용자 정보 조회
  const user = await getCurrentUserOrDemo();

  return <MedicationDashboard userId={user.id} userName={user.name} />;
}
