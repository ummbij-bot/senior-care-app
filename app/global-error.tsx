"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/sentry";

/**
 * 글로벌 에러 경계 (치명적 오류)
 * - root layout 자체가 깨질 때 표시되는 최후의 fallback
 * - Sentry로 에러 자동 리포트
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry에 에러 리포트
    captureException(error, {
      type: "global_error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ fontFamily: "Pretendard, sans-serif", background: "#faf8f5", margin: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>
            &#9888;
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1c1917", marginBottom: "12px" }}>
            죄송합니다
          </h1>
          <p style={{ fontSize: "20px", color: "#57534e", marginBottom: "32px" }}>
            예상치 못한 오류가 발생했습니다
          </p>
          <button
            onClick={reset}
            style={{
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#ffffff",
              backgroundColor: "#2563b0",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              marginBottom: "12px",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            다시 시도
          </button>
          <a
            href="/"
            style={{
              display: "block",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#2563b0",
              backgroundColor: "transparent",
              border: "2px solid #d6d3d1",
              borderRadius: "12px",
              textDecoration: "none",
              width: "100%",
              maxWidth: "320px",
              boxSizing: "border-box",
            }}
          >
            홈으로 돌아가기
          </a>
          {error.digest && (
            <p style={{ marginTop: "24px", fontSize: "14px", color: "#a8a29e" }}>
              오류 코드: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
