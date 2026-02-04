import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트) 전용 Supabase 인스턴스
 * - 기존 supabase-client.ts 대체
 * - Auth 세션 자동 갱신 지원
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
