/**
 * SMS 발송 유틸리티 (스켈레톤)
 *
 * 프로덕션에서는 실제 SMS API 연동 예정:
 * - NHN Cloud SMS (구 Toast)
 * - CoolSMS / Solapi
 * - Twilio
 *
 * 현재는 console.log로 대체 (개발용)
 */

/**
 * SMS 문자 발송
 * @param to - 수신자 전화번호 (예: "010-1234-5678")
 * @param message - 발송할 메시지 내용
 * @returns 발송 성공 여부
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  // TODO: 실제 SMS API 연동
  // 예시 (Solapi):
  // const response = await fetch("https://api.solapi.com/messages/v4/send", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.SOLAPI_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     message: { to, from: process.env.SMS_SENDER_NUMBER, text: message },
  //   }),
  // });
  // return response.ok;

  console.log(`[SMS] 발송 (스켈레톤):`);
  console.log(`  수신: ${to}`);
  console.log(`  내용: ${message}`);
  console.log(`  시간: ${new Date().toISOString()}`);

  return true;
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
