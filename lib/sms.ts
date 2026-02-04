/**
 * SMS 발송 유틸리티 - Solapi (CoolSMS) API 연동
 *
 * 환경변수:
 * - SOLAPI_API_KEY: Solapi API Key
 * - SOLAPI_API_SECRET: Solapi API Secret
 * - SMS_SENDER_NUMBER: 발신 번호 (사전 등록 필수, 예: "01012345678")
 *
 * Solapi 대시보드: https://console.solapi.com
 * API 문서: https://docs.solapi.com
 */

import crypto from "crypto";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SMS_SENDER_NUMBER = process.env.SMS_SENDER_NUMBER || "";
const SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send-many/detail";

/**
 * Solapi HMAC 인증 헤더 생성
 */
function createSolapiAuthHeader(): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", SOLAPI_API_SECRET)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 전화번호 정리 (하이픈 제거)
 */
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * SMS 문자 발송 (Solapi API)
 * @param to - 수신자 전화번호 (예: "010-1234-5678")
 * @param message - 발송할 메시지 내용
 * @returns 발송 성공 여부
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  // API 키 미설정 시 스켈레톤 모드
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SMS_SENDER_NUMBER) {
    console.log(`[SMS] 스켈레톤 모드 (API 키 미설정):`);
    console.log(`  수신: ${to}`);
    console.log(`  내용: ${message}`);
    console.log(`  시간: ${new Date().toISOString()}`);
    return true;
  }

  try {
    const response = await fetch(SOLAPI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createSolapiAuthHeader(),
      },
      body: JSON.stringify({
        messages: [
          {
            to: cleanPhone(to),
            from: cleanPhone(SMS_SENDER_NUMBER),
            text: message,
            type: "SMS",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[SMS] 발송 실패:", response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log("[SMS] 발송 성공:", result);
    return true;
  } catch (err) {
    console.error("[SMS] 발송 에러:", err);
    return false;
  }
}

/**
 * 보호자에게 복약 미이행 알림 발송
 */
export async function sendMedicationAlert(
  guardianPhone: string,
  seniorName: string,
  medicationName: string
): Promise<boolean> {
  const message = `[시니어케어] ${seniorName} 어르신이 ${medicationName} 복약을 놓치셨습니다. 확인해 주세요.`;
  return sendSMS(guardianPhone, message);
}

/**
 * 보호자에게 긴급 신고 알림 발송
 */
export async function sendEmergencyAlert(
  guardianPhone: string,
  seniorName: string
): Promise<boolean> {
  const message = `[시니어케어 긴급] ${seniorName} 어르신이 긴급 신고를 하셨습니다. 즉시 확인해 주세요.`;
  return sendSMS(guardianPhone, message);
}
