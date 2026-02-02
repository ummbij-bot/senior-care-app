import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/payments/webhook
 *
 * Toss Payments 웹훅 수신
 * - 결제 상태 변경 (취소, 환불 등) 시 DB 동기화
 * - Toss Dashboard → 웹훅 URL에 이 엔드포인트 등록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    switch (eventType) {
      // 결제 취소/환불
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, status } = data;

        if (status === "CANCELED" || status === "PARTIAL_CANCELED") {
          // 결제 내역 상태 업데이트
          const { data: payment } = await supabase
            .from("payment_history")
            .update({ status: "refunded" })
            .eq("toss_payment_key", paymentKey)
            .select("user_id, subscription_id")
            .single();

          if (payment) {
            // 구독 상태 취소
            if (payment.subscription_id) {
              await supabase
                .from("subscriptions")
                .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
                .eq("id", payment.subscription_id);
            }

            // 프로필 무료로 다운그레이드
            await supabase
              .from("profiles")
              .update({
                membership_tier: "free",
                membership_expires_at: null,
              })
              .eq("id", payment.user_id);
          }
        }
        break;
      }

      default:
        console.log(`[webhook] 미처리 이벤트: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[webhook] 오류:", err);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
