import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 브라우저(클라이언트) 전용 Supabase 인스턴스
 * - 싱글톤 패턴으로 중복 생성 방지
 * - Realtime 구독에 사용
 * - 타입은 개별 쿼리 결과에서 캐스팅 (supabase-js v2 제네릭 추론 이슈 회피)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 2, // 시니어 앱은 높은 빈도 불필요
    },
  },
});
