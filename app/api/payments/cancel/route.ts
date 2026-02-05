import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cancelPayment } from "@/lib/toss-payments";

/**
 * POST /api/payments/cancel
 *
 * 관리자 전용 결제 취소(환불) API
 *
 * Body:
 * - paymentKey: string (토스 결제 키)
 * - cancelReason: string (취소 사유)
 * - paymentId: string (DB payment_history.id)
 *
 * 흐름:
 * 1. 관리자 권한 확인
 * 2. Toss Payments 취소 API 호출
 * 3. payment_history 상태 업데이트 → 'cancelled'
 * 4. 프로필 멤버십 다운그레이드 (해당 시)
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentKey, cancelReason, paymentId } = await request.json();

    if (!paymentKey || !cancelReason || !paymentId) {
      return NextResponse.json(
        { error: "paymentKey, cancelReason, paymentId는 필수입니다" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. 결제 내역 조회
    const { data: payment, error: fetchError } = await supabase
      .from("payment_history")
      .select("id, user_id, toss_payment_key, status, subscription_id, amount")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: "해당 결제 내역을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (payment.status === "cancelled" || payment.status === "refunded") {
      return NextResponse.json(
        { error: "이미 취소/환불된 결제입니다" },
        { status: 400 }
      );
    }

    // 2. Toss Payments 취소 요청
    const result = await cancelPayment(paymentKey, cancelReason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "토스 결제 취소에 실패했습니다" },
        { status: 400 }
      );
    }

    // 3. payment_history 상태 업데이트
    await supabase
      .from("payment_history")
      .update({
        status: "cancelled",
        failed_reason: `[환불] ${cancelReason}`,
      })
      .eq("id", paymentId);

    // 4. 연관 구독 취소
    if (payment.subscription_id) {
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", payment.subscription_id);
    }

    // 5. 프로필 멤버십 다운그레이드
    // 남은 활성 구독이 있는지 확인 후 다운그레이드
    const { data: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", payment.user_id)
      .eq("status", "active")
      .limit(1);

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      await supabase
        .from("profiles")
        .update({
          membership_tier: "free",
          membership_expires_at: null,
        })
        .eq("id", payment.user_id);
    }

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 취소되었습니다",
      refundAmount: payment.amount,
    });
  } catch (err) {
    console.error("[payments/cancel] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
