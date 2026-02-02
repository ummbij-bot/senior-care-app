import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmPayment } from '@/lib/toss-payments';

/**
 * POST /api/payments/confirm
 *
 * Toss Payments 결제 승인 → DB 반영
 *
 * 흐름:
 * 1. 클라이언트에서 결제 완료 후 paymentKey, orderId, amount 전송
 * 2. 서버에서 Toss API로 결제 승인 요청
 * 3. 승인 성공 시 payment_history INSERT + profiles 멤버십 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, userId, interval } =
      await request.json();

    if (!paymentKey || !orderId || !amount || !userId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 },
      );
    }

    // 1. Toss 결제 승인
    const result = await confirmPayment({ paymentKey, orderId, amount });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    if (!result.success) {
      // 결제 실패 기록
      await supabase.from('payment_history').insert({
        user_id: userId,
        toss_payment_key: paymentKey,
        toss_order_id: orderId,
        amount,
        status: 'failed',
        failed_reason: result.error,
      });

      return NextResponse.json(
        { error: result.error ?? '결제 승인에 실패했습니다' },
        { status: 400 },
      );
    }

    // 2. 구독 만료일 계산
    const now = new Date();
    const expiresAt = new Date(now);
    if (interval === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 3. 구독 생성
    const { data: subscription } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: 'premium',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        amount,
        interval: interval ?? 'monthly',
      })
      .select('id')
      .single();

    // 4. 결제 내역 저장
    await supabase.from('payment_history').insert({
      user_id: userId,
      subscription_id: subscription?.id,
      toss_payment_key: paymentKey,
      toss_order_id: orderId,
      amount,
      status: 'confirmed',
      method: result.data?.method ?? null,
      description: `시니어케어 프리미엄 (${interval === 'yearly' ? '연간' : '월간'})`,
      paid_at: new Date().toISOString(),
      receipt_url: result.data?.receipt?.url ?? null,
    });

    // 5. 프로필 멤버십 업데이트
    await supabase
      .from('profiles')
      .update({
        membership_tier: 'premium',
        membership_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      membership: 'premium',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[payments/confirm] 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
