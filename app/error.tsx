"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw, Phone } from "lucide-react";
import { captureException } from "@/lib/sentry";

/**
 * 글로벌 에러 페이지
 * - 시니어 친화적: 큰 글씨, 친절한 안내, 명확한 버튼
 * - 복잡한 에러 로그 대신 이해하기 쉬운 메시지 표시
 * - Sentry 에러 리포트 전송
 * - 긴급 신고 바로가기 버튼 (에러 상황에서도 사용 가능)
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[에러 발생]", error);
    captureException(error);
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
          잠시 문제가 생겼어요
        </h1>
        <p className="mt-3 text-xl text-text-secondary leading-relaxed">
          걱정하지 마세요!<br />
          아래 버튼을 눌러주세요
        </p>

        {/* 버튼들 — 시니어가 쉽게 누를 수 있도록 크게 */}
        <div className="mt-10 flex flex-col gap-4">
          <button
            onClick={reset}
            className="btn btn-primary btn-lg flex w-full items-center justify-center gap-3 text-xl"
          >
            <RotateCcw className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            이 버튼을 눌러주세요
          </button>

          <a
            href="/"
            className="btn btn-outline btn-lg flex w-full items-center justify-center gap-3 text-xl"
          >
            <Home className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            홈으로 돌아가기
          </a>

          {/* 긴급 상황 시 에러 화면에서도 신고 가능 */}
          <a
            href="/emergency"
            className="btn btn-danger btn-lg flex w-full items-center justify-center gap-3 text-xl"
          >
            <Phone className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            긴급 신고
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
