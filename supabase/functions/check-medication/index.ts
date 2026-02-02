// ============================================
// Supabase Edge Function: check-medication
//
// 역할: Cron Job으로 30분마다 실행되어
// 미복용(pending) 상태인 로그를 확인하고
// 보호자에게 Web Push 알림을 발송
//
// 배포: supabase functions deploy check-medication
// Cron 설정: Supabase Dashboard에서 pg_cron 확장으로 30분 간격 호출
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Push 라이브러리 (Deno 호환)
// TODO: 실제 배포 시 web-push 대신 직접 HTTP 요청 사용 가능

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "mailto:admin@seniorcare.app";

// 유예 시간: 스케줄 시간 + GRACE_MINUTES 지나면 미복용으로 간주
const GRACE_MINUTES = 30;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // "2026-02-02"
    const currentHHMM = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // ── 1. 유예 시간이 지난 pending 로그 찾기 ──
    // 예: 현재 08:35이면, 08:05 이전 스케줄 중 pending인 것
    const graceTime = new Date(now.getTime() - GRACE_MINUTES * 60 * 1000);
    const graceHHMM = `${graceTime.getHours().toString().padStart(2, "0")}:${graceTime.getMinutes().toString().padStart(2, "0")}`;

    const { data: overdueLogs, error: logsError } = await supabase
      .from("medication_logs")
      .select(`
        *,
        medications (name, dosage),
        medication_schedules (label)
      `)
      .eq("scheduled_date", today)
      .eq("status", "pending")
      .eq("notified_guardian", false)
      .lte("scheduled_time", graceHHMM);

    if (logsError) {
      console.error("로그 조회 실패:", logsError);
      return new Response(JSON.stringify({ error: logsError.message }), {
        status: 500,
      });
    }

    if (!overdueLogs || overdueLogs.length === 0) {
      return new Response(
        JSON.stringify({ message: "미복용 로그 없음", checked_at: currentHHMM }),
        { status: 200 }
      );
    }

    console.log(`[check-medication] ${overdueLogs.length}건 미복용 발견`);

    // ── 2. 사용자별로 그룹핑 ──
    const logsByUser = new Map<string, typeof overdueLogs>();
    for (const log of overdueLogs) {
      const existing = logsByUser.get(log.user_id) ?? [];
      existing.push(log);
      logsByUser.set(log.user_id, existing);
    }

    // ── 3. 각 시니어의 보호자에게 알림 발송 ──
    const results: Array<{ userId: string; notified: boolean; error?: string }> = [];

    for (const [seniorId, logs] of logsByUser) {
      // 보호자 찾기
      const { data: guardians } = await supabase
        .from("profiles")
        .select("id, name, push_subscription")
        .eq("linked_to", seniorId)
        .eq("role", "guardian");

      if (!guardians || guardians.length === 0) {
        results.push({ userId: seniorId, notified: false, error: "보호자 없음" });
        continue;
      }

      // 시니어 이름 가져오기
      const { data: senior } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", seniorId)
        .single();

      const seniorName = senior?.name ?? "어르신";
      const missedMeds = logs
        .map((l: any) => l.medications?.name ?? "약")
        .join(", ");

      // 각 보호자에게 Push 발송
      for (const guardian of guardians) {
        if (!guardian.push_subscription) {
          results.push({
            userId: seniorId,
            notified: false,
            error: `보호자 ${guardian.name} Push 미등록`,
          });
          continue;
        }

        try {
          const subscription = JSON.parse(guardian.push_subscription as string);

          // Web Push API 직접 호출 (간단 구현)
          // 프로덕션에서는 web-push 라이브러리 또는 FCM 사용 권장
          const pushPayload = JSON.stringify({
            title: `${seniorName} 어르신 미복용 알림`,
            body: `${missedMeds}을(를) 아직 복용하지 않았습니다`,
            tag: `guardian-alert-${seniorId}`,
            url: `/guardian?senior=${seniorId}`,
          });

          // TODO: 실제 Web Push 발송 로직
          // await webpush.sendNotification(subscription, pushPayload);
          console.log(`[Push] 보호자 ${guardian.name}에게 알림 발송:`, pushPayload);

          results.push({ userId: seniorId, notified: true });
        } catch (pushError) {
          console.error(`Push 발송 실패:`, pushError);
          results.push({
            userId: seniorId,
            notified: false,
            error: String(pushError),
          });
        }
      }

      // ── 4. 알림 발송 완료 표시 (중복 방지) ──
      const logIds = logs.map((l: any) => l.id);
      await supabase
        .from("medication_logs")
        .update({ notified_guardian: true })
        .in("id", logIds);

      // ── 5. pending → missed 로 상태 변경 (1시간 경과 시) ──
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourHHMM = `${oneHourAgo.getHours().toString().padStart(2, "0")}:${oneHourAgo.getMinutes().toString().padStart(2, "0")}`;

      await supabase
        .from("medication_logs")
        .update({ status: "missed" })
        .eq("scheduled_date", today)
        .eq("status", "pending")
        .eq("user_id", seniorId)
        .lte("scheduled_time", oneHourHHMM);
    }

    return new Response(
      JSON.stringify({
        message: `${overdueLogs.length}건 처리 완료`,
        results,
        checked_at: currentHHMM,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("[check-medication] 오류:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
});
