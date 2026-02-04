/**
 * 긴급 알림 Failover 시스템
 *
 * 흐름:
 * 1. FCM 푸시 알림 먼저 시도
 * 2. 1분 내 Ack 없으면 SMS 자동 발송
 *
 * 서버 사이드에서만 사용 (API Route / Server Action)
 */

import { sendEmergencyAlert } from "@/lib/sms";

/**
 * FCM 푸시 알림 발송 (스켈레톤)
 * - 프로덕션에서는 Firebase Admin SDK 사용
 * - 보호자의 push_subscription 토큰으로 발송
 */
async function sendFCMNotification(
  pushToken: string,
  title: string,
  body: string
): Promise<boolean> {
  // TODO: Firebase Admin SDK 연동
  // import admin from "firebase-admin";
  // const message = {
  //   token: pushToken,
  //   notification: { title, body },
  //   android: { priority: "high" },
  //   webpush: { headers: { Urgency: "high" } },
  // };
  // await admin.messaging().send(message);

  console.log(`[FCM] 푸시 알림 발송 (스켈레톤):`);
  console.log(`  토큰: ${pushToken.slice(0, 20)}...`);
  console.log(`  제목: ${title}`);
  console.log(`  내용: ${body}`);

  // 스켈레톤: 항상 성공 반환
  return true;
}

/**
 * Ack 확인 대기 (스켈레톤)
 * - 프로덕션에서는 DB/Redis에서 알림 확인 상태를 폴링
 * - 보호자가 앱을 열면 Ack 기록
 */
async function waitForAck(
  notificationId: string,
  timeoutMs: number = 60000
): Promise<boolean> {
  // TODO: 실제 구현에서는 DB 폴링 또는 WebSocket으로 Ack 감지
  // const deadline = Date.now() + timeoutMs;
  // while (Date.now() < deadline) {
  //   const { data } = await supabase
  //     .from("notification_acks")
  //     .select("acked_at")
  //     .eq("notification_id", notificationId)
  //     .single();
  //   if (data?.acked_at) return true;
  //   await new Promise(r => setTimeout(r, 5000)); // 5초 간격 폴링
  // }

  console.log(`[Failover] Ack 대기 중 (${timeoutMs / 1000}초)...`);

  // 스켈레톤: 타임아웃 시뮬레이션 (항상 실패 = SMS로 Failover)
  await new Promise((r) => setTimeout(r, Math.min(timeoutMs, 3000)));
  return false;
}

/**
 * 긴급 알림 Failover 실행
 *
 * 1. 보호자에게 FCM 푸시 알림 발송
 * 2. 1분 대기 후 Ack 없으면 SMS 자동 발송
 *
 * @param guardianPhone - 보호자 전화번호
 * @param guardianPushToken - 보호자 FCM/Web Push 토큰 (없을 수 있음)
 * @param seniorName - 어르신 이름
 * @returns { pushSent, smsSent } 각 채널 발송 여부
 */
export async function notifyGuardianWithFailover(
  guardianPhone: string,
  guardianPushToken: string | null,
  seniorName: string
): Promise<{ pushSent: boolean; smsSent: boolean }> {
  let pushSent = false;
  let smsSent = false;

  // 1. FCM 푸시 알림 시도
  if (guardianPushToken) {
    try {
      pushSent = await sendFCMNotification(
        guardianPushToken,
        "[긴급] 시니어케어 긴급 신고",
        `${seniorName} 어르신이 긴급 신고를 하셨습니다. 즉시 확인해 주세요.`
      );
    } catch (err) {
      console.error("[Failover] FCM 발송 실패:", err);
      pushSent = false;
    }
  }

  // 2. 푸시 실패 또는 Ack 없으면 SMS Failover
  if (!pushSent) {
    // 푸시 자체가 실패: 즉시 SMS 발송
    console.log("[Failover] 푸시 실패 → 즉시 SMS 발송");
    smsSent = await sendEmergencyAlert(guardianPhone, seniorName);
  } else {
    // 푸시 성공: 1분 대기 후 Ack 확인
    const notificationId = `emergency_${Date.now()}`;
    const acked = await waitForAck(notificationId, 60000);

    if (!acked) {
      console.log("[Failover] 1분 내 Ack 없음 → SMS Failover 발송");
      smsSent = await sendEmergencyAlert(guardianPhone, seniorName);
    } else {
      console.log("[Failover] 보호자 Ack 확인됨 → SMS 불필요");
    }
  }

  console.log(`[Failover 결과] 푸시: ${pushSent}, SMS: ${smsSent}`);
  return { pushSent, smsSent };
}
