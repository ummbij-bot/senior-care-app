import { getCurrentUserOrDemo } from "@/lib/auth/getCurrentUser";
import EmergencyClient from "./EmergencyClient";

/**
 * 긴급 신고 페이지 (Server Component)
 * - 보호자 전화번호를 DB에서 조회
 * - 클라이언트 컴포넌트에 props로 전달
 */
export default async function EmergencyPage() {
  const user = await getCurrentUserOrDemo();

  return <EmergencyClient guardianPhone={user.guardianPhone} />;
}
