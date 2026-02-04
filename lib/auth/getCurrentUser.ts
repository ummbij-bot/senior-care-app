import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 현재 로그인한 사용자 정보 타입
 */
export type CurrentUser = {
  id: string;
  name: string;
  role: "senior" | "guardian" | "admin";
  phone: string | null;
  guardianPhone: string | null; // 시니어에 연결된 보호자 전화번호
};

/**
 * 현재 로그인한 사용자의 정보를 조회
 * - Server Component에서 사용
 * - Auth + profiles 테이블 조인
 *
 * @returns CurrentUser 또는 null (비로그인)
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();

  // Supabase Auth에서 현재 사용자 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // profiles 테이블에서 사용자 프로필 조회
  // profiles.id가 auth.users.id와 동일하다고 가정
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.warn("프로필 조회 실패:", error?.message);
    return null;
  }

  // 시니어인 경우, 연결된 보호자의 전화번호 조회
  let guardianPhone: string | null = null;

  if (profile.role === "senior") {
    const { data: guardian } = await supabase
      .from("profiles")
      .select("phone")
      .eq("linked_to", user.id)
      .eq("role", "guardian")
      .single();

    guardianPhone = guardian?.phone ?? null;
  }

  return {
    id: user.id,
    name: profile.name,
    role: profile.role as "senior" | "guardian" | "admin",
    phone: profile.phone,
    guardianPhone,
  };
}

/**
 * 현재 로그인한 사용자 정보를 조회하거나, 비로그인 시 /login으로 리다이렉트
 * - Server Component에서 사용
 * - middleware.ts와 이중 보호 (defense-in-depth)
 */
export async function getCurrentUserOrDemo(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
