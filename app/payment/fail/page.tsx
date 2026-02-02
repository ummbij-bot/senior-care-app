import { XCircle } from "lucide-react";

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const params = await searchParams;
  const message = params.message ?? "결제가 취소되었거나 실패했습니다";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <XCircle className="h-20 w-20 text-danger" strokeWidth={1.8} />
      <h1 className="mt-6 text-3xl font-bold text-text-primary">결제 실패</h1>
      <p className="mt-3 text-lg text-text-secondary text-center">{message}</p>
      <div className="mt-8 flex gap-3">
        <a href="/pricing" className="btn btn-primary">다시 시도하기</a>
        <a href="/" className="btn btn-outline">홈으로</a>
      </div>
    </div>
  );
}
