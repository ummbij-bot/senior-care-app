import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "관리자 대시보드 - 시니어 건강관리",
};

/**
 * 관리자 대시보드 (Server Component)
 * - middleware에서 1차 권한 검사 후 여기서 2차 방어
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const supabase = await createSupabaseServerClient();

  // 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // role 확인 (defense-in-depth)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const currentTab = params.tab || "users";
  const currentPage = parseInt(params.page || "1", 10);
  const PAGE_SIZE = 20;
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 유저 목록 조회
  let users: Array<{
    id: string;
    name: string;
    phone: string | null;
    role: string;
    membership_tier: string;
    is_banned: boolean;
    created_at: string;
  }> = [];
  let userTotal = 0;

  if (currentTab === "users") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    userTotal = count || 0;

    const { data } = await supabase
      .from("profiles")
      .select("id, name, phone, role, membership_tier, is_banned, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    users = data || [];
  }

  // 결제 내역 조회
  let payments: Array<{
    id: string;
    toss_order_id: string;
    amount: number;
    status: string;
    method: string | null;
    description: string | null;
    created_at: string;
    user_name: string;
  }> = [];
  let paymentTotal = 0;

  if (currentTab === "payments") {
    const { count } = await supabase
      .from("payment_history")
      .select("*", { count: "exact", head: true });
    paymentTotal = count || 0;

    const { data } = await supabase
      .from("payment_history")
      .select("id, toss_order_id, amount, status, method, description, created_at, user_id")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      // 유저 이름 일괄 조회
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const nameMap = new Map(
        (userProfiles || []).map((p) => [p.id, p.name])
      );

      payments = data.map((p) => ({
        id: p.id,
        toss_order_id: p.toss_order_id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        description: p.description,
        created_at: p.created_at,
        user_name: nameMap.get(p.user_id) || "알 수 없음",
      }));
    }
  }

  const totalItems = currentTab === "users" ? userTotal : paymentTotal;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <AdminDashboard
      currentTab={currentTab}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      users={users}
      payments={payments}
    />
  );
}
