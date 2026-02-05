import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

/**
 * POST /api/emergency-notify
 *
 * 긴급 신고 시 보호자에게 SMS + 위치 링크 전송
 * - Rate limiting은 lib/sms.ts에서 처리 (3분 내 중복 차단)
 *
 * Body:
 * - phone: string (보호자 전화번호)
 * - message: string (발송 메시지)
 * - locationLink: string | null (Google Maps 링크)
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone과 message는 필수입니다" },
        { status: 400 }
      );
    }

    // SMS 발송 (Rate Limiting 포함)
    const success = await sendSMS(phone, message);

    if (!success) {
      return NextResponse.json(
        { error: "SMS 발송에 실패했습니다 (rate limit 또는 발송 오류)" },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[emergency-notify] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
