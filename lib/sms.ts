/**
 * SMS 발송 유틸리티 - Solapi (CoolSMS) API 연동 + Rate Limiting
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
import { createClient } from "@supabase/supabase-js";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SMS_SENDER_NUMBER = process.env.SMS_SENDER_NUMBER || "";
const SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send-many/detail";

/** Rate Limit: 같은 번호로 3분 이내 재발송 차단 */
const RATE_LIMIT_SECONDS = 180;

/**
 * Supabase 서비스 클라이언트 (sms_logs RLS bypass 용)
 * - sms_logs 테이블은 anon key로 접근 불가 (RLS deny all)
 * - 서버 사이드에서만 service_role key 또는 anon key로 조회
 *   (RLS를 bypass하려면 SUPABASE_SERVICE_ROLE_KEY 필요)
 *
 * 현재는 anon key + RLS policy "Deny all"이므로,
 * service role key가 없으면 rate limit 검사를 건너뛰고 발송만 진행
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null; // service role key 미설정 시 rate limit 스킵
  }

  return createClient(url, serviceKey);
}

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
 * Rate Limit 체크: 해당 전화번호로 최근 N초 이내 발송 기록이 있는지 확인
 * @returns true = 발송 가능, false = 차단 (3분 이내 중복)
 */
async function checkRateLimit(phone: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // service role key 없으면 rate limit 검사 스킵 (개발 모드)
    console.log("[SMS] Rate limit 스킵 (SUPABASE_SERVICE_ROLE_KEY 미설정)");
    return true;
  }

  const cleanedPhone = cleanPhone(phone);
  const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();

  const { data, error } = await supabase
    .from("sms_logs")
    .select("id")
    .eq("phone_number", cleanedPhone)
    .eq("status", "sent")
    .gte("sent_at", cutoff)
    .limit(1);

  if (error) {
    console.error("[SMS] Rate limit 조회 실패:", error);
    // 조회 실패 시 안전하게 발송 허용 (서비스 가용성 우선)
    return true;
  }

  return !data || data.length === 0;
}

/**
 * SMS 발송 로그 저장
 */
async function logSMS(
  phone: string,
  message: string,
  status: "sent" | "failed" | "blocked"
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const cleanedPhone = cleanPhone(phone);

  await supabase.from("sms_logs").insert({
    phone_number: cleanedPhone,
    status,
    message_preview: message.slice(0, 50),
    sent_at: new Date().toISOString(),
  });
}

/**
 * SMS 문자 발송 (Solapi API + Rate Limiting)
 * @param to - 수신자 전화번호 (예: "010-1234-5678")
 * @param message - 발송할 메시지 내용
 * @returns 발송 성공 여부
 * @throws Rate limit 초과 시 에러 반환이 아닌 false 반환 + 로그 기록
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  // ── Rate Limit 체크 ──
  const allowed = await checkRateLimit(to);
  if (!allowed) {
    console.warn(`[SMS] Rate limit 초과 — ${cleanPhone(to)} (${RATE_LIMIT_SECONDS}초 내 중복 발송 차단)`);
    await logSMS(to, message, "blocked");
    return false;
  }

  // ── API 키 미설정 시 스켈레톤 모드 ──
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SMS_SENDER_NUMBER) {
    console.log(`[SMS] 스켈레톤 모드 (API 키 미설정):`);
    console.log(`  수신: ${to}`);
    console.log(`  내용: ${message}`);
    console.log(`  시간: ${new Date().toISOString()}`);
    await logSMS(to, message, "sent");
    return true;
  }

  // ── 실제 Solapi API 발송 ──
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
      await logSMS(to, message, "failed");
      return false;
    }

    const result = await response.json();
    console.log("[SMS] 발송 성공:", result);
    await logSMS(to, message, "sent");
    return true;
  } catch (err) {
    console.error("[SMS] 발송 에러:", err);
    await logSMS(to, message, "failed");
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
