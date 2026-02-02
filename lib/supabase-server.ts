import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 서버 전용 Supabase 인스턴스
 * - API Routes, Server Components에서 사용
 * - 매 요청마다 새 인스턴스 생성 (보안)
 */
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
