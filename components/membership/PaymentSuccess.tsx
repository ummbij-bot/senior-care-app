"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";

type Props = {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId: string;
  interval: string;
};

/**
 * 결제 성공 리다이렉트 페이지
 * - Toss에서 리다이렉트 후 서버에 승인 요청
 * - 승인 성공 → 완료 화면
 * - 승인 실패 → 에러 화면
 */
export default function PaymentSuccess({
  paymentKey,
  orderId,
  amount,
  userId,
  interval,
}: Props) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function confirm() {
      if (!paymentKey || !orderId || !amount || !userId) {
        setStatus("error");
        setErrorMessage("결제 정보가 올바르지 않습니다");
        return;
      }

      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount, userId, interval }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error ?? "결제 승인에 실패했습니다");
        }
      } catch {
        setStatus("error");
        setErrorMessage("서버와 통신 중 오류가 발생했습니다");
      }
    }

    confirm();
  }, [paymentKey, orderId, amount, userId, interval]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
          <p className="mt-6 text-2xl font-bold text-text-primary">결제 확인 중...</p>
          <p className="mt-2 text-lg text-text-secondary">잠시만 기다려 주세요</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <CheckCircle className="mx-auto h-20 w-20 text-emerald-500" strokeWidth={1.8} />
          <h1 className="mt-6 text-3xl font-bold text-text-primary">
            결제가 완료되었어요!
          </h1>
          <p className="mt-3 text-xl text-text-secondary">
            프리미엄 회원이 되신 것을
            <br />
            축하드려요
          </p>
          <a href="/" className="btn btn-primary btn-lg mt-8 inline-flex">
            <Home className="mr-2 h-6 w-6" />
            홈으로 돌아가기
          </a>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <XCircle className="mx-auto h-20 w-20 text-danger" strokeWidth={1.8} />
          <h1 className="mt-6 text-3xl font-bold text-text-primary">
            결제에 실패했어요
          </h1>
          <p className="mt-3 text-lg text-text-secondary">{errorMessage}</p>
          <div className="mt-8 flex gap-3">
            <a href="/pricing" className="btn btn-primary">
              다시 시도하기
            </a>
            <a href="/" className="btn btn-outline">
              홈으로
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
