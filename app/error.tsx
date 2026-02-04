"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

/**
 * 글로벌 에러 페이지
 * - 시니어 친화적: 큰 글씨, 친절한 안내, 명확한 버튼
 * - 복잡한 에러 로그 대신 이해하기 쉬운 메시지 표시
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (개발/모니터링용)
    console.error("[에러 발생]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <div
        className="w-full max-w-md text-center"
        role="alert"
        aria-live="assertive"
      >
        {/* 아이콘 */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle
            className="h-12 w-12 text-amber-600"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        {/* 안내 문구 */}
        <h1 className="mt-8 text-3xl font-bold text-text-primary">
          죄송합니다
        </h1>
        <p className="mt-3 text-xl text-text-secondary">
          잠시 후 다시 시도해주세요
        </p>

        {/* 버튼들 */}
        <div className="mt-10 flex flex-col gap-4">
          <button
            onClick={reset}
            className="btn btn-primary flex w-full items-center justify-center gap-3"
          >
            <RotateCcw className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            다시 시도
          </button>

          <a
            href="/"
            className="btn btn-outline flex w-full items-center justify-center gap-3"
          >
            <Home className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            홈으로 돌아가기
          </a>
        </div>

        {/* 에러 참조 코드 (디버깅용) */}
        {error.digest && (
          <p className="mt-8 text-sm text-text-muted">
            오류 코드: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
