/**
 * Sentry 초기화 설정
 *
 * @sentry/nextjs 패키지 설치 후 사용:
 * npm install @sentry/nextjs
 *
 * 환경변수 필요:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry 프로젝트 DSN
 * - SENTRY_ORG: Sentry 조직명
 * - SENTRY_PROJECT: Sentry 프로젝트명
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

/**
 * Sentry 클라이언트 초기화 (브라우저)
 */
export function initSentryClient() {
  if (!SENTRY_DSN) {
    console.warn("[Sentry] DSN이 설정되지 않았습니다. 에러 모니터링이 비활성화됩니다.");
    return;
  }

  // @sentry/nextjs가 설치되면 아래 코드 활성화:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   tracesSampleRate: 0.1, // 성능 추적 10%
  //   replaysSessionSampleRate: 0, // 세션 리플레이 비활성화
  //   replaysOnErrorSampleRate: 1.0, // 에러 시 리플레이 100%
  //   environment: process.env.NODE_ENV,
  // });

  console.log("[Sentry] 클라이언트 초기화 (스켈레톤)");
}

/**
 * Sentry 서버 초기화
 */
export function initSentryServer() {
  if (!SENTRY_DSN) return;

  // import * as Sentry from "@sentry/nextjs";
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   tracesSampleRate: 0.1,
  //   environment: process.env.NODE_ENV,
  // });

  console.log("[Sentry] 서버 초기화 (스켈레톤)");
}

/**
 * 에러를 Sentry에 수동 리포트
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    console.error("[Sentry 스켈레톤] 에러 캡처:", error.message, context);
    return;
  }

  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error, { extra: context });

  console.error("[Sentry] 에러 리포트:", error.message, context);
}
