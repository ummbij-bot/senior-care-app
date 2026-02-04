import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 보안 미들웨어
 * - 비로그인 유저가 보호 경로 접근 시 /login으로 리다이렉트
 * - Supabase 세션 쿠키 자동 갱신
 */

// 공개 경로 (인증 불필요)
const PUBLIC_PATHS = ["/login", "/legal"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 확인 + 갱신 (getUser는 서버에서 검증)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비인증 + 보호 경로 → /login으로 리다이렉트
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 유저가 /login 접근 시 홈으로
  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 정적 파일 & API 제외:
     * - _next/static, _next/image, favicon.ico
     * - icons/, manifest.json, sw.js
     * - api/
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.json|sw\\.js|api/).*)",
  ],
};
