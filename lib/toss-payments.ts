/* ============================================
   Toss Payments 서버 유틸리티

   - 결제 승인 (confirm)
   - 정기결제 빌링키 발급
   - 환불

   환경변수:
   TOSS_SECRET_KEY       — 시크릿 키 (서버 전용)
   NEXT_PUBLIC_TOSS_CLIENT_KEY — 클라이언트 키
   ============================================ */

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function getAuthHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다");
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * 단건 결제 승인
 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const res = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.message ?? "결제 승인 실패", data };
  }

  return { success: true, data };
}

/**
 * 정기결제 빌링키 발급
 */
export async function issueBillingKey(params: {
  authKey: string;
  customerKey: string;
}) {
  const res = await fetch(`${TOSS_API_BASE}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  return res.ok ? { success: true, data } : { success: false, error: data.message, data };
}

/**
 * 빌링키로 자동 결제 실행
 */
export async function executeBilling(params: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const res = await fetch(`${TOSS_API_BASE}/billing/${params.billingKey}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
    }),
  });

  const data = await res.json();
  return res.ok ? { success: true, data } : { success: false, error: data.message, data };
}

/**
 * 결제 취소 (환불)
 */
export async function cancelPayment(paymentKey: string, reason: string) {
  const res = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason: reason }),
  });

  const data = await res.json();
  return res.ok ? { success: true, data } : { success: false, error: data.message, data };
}
