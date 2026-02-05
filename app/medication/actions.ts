"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 오늘의 복약 로그를 안전하게 Upsert
 *
 * medication_logs 테이블에 UNIQUE(schedule_id, scheduled_date) 제약 조건이 있으므로
 * ON CONFLICT로 중복을 방지합니다.
 *
 * @param scheduleId - 복약 스케줄 ID
 * @param userId - 사용자 ID
 * @param medicationId - 약 ID
 * @param scheduledTime - 복약 예정 시각 (HH:MM)
 */
export async function upsertMedicationLog(
  scheduleId: string,
  userId: string,
  medicationId: string,
  scheduledTime: string
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: "인증되지 않은 사용자입니다" };
    }

    const today = new Date().toISOString().split("T")[0];

    // Upsert: 중복이면 updated_at만 갱신
    const { data, error } = await supabase
      .from("medication_logs")
      .upsert(
        {
          schedule_id: scheduleId,
          user_id: userId,
          medication_id: medicationId,
          scheduled_date: today,
          scheduled_time: scheduledTime,
          status: "pending",
        },
        {
          onConflict: "schedule_id,scheduled_date",
          ignoreDuplicates: true, // 이미 존재하면 아무것도 하지 않음
        }
      )
      .select("id")
      .single();

    if (error) {
      // 중복 무시한 경우 에러가 아님
      if (error.code === "PGRST116") {
        return { success: true };
      }
      console.error("[upsertMedicationLog] 에러:", error);
      return { success: false, error: error.message };
    }

    return { success: true, logId: data?.id };
  } catch (err) {
    console.error("[upsertMedicationLog] 예외:", err);
    return { success: false, error: "서버 오류가 발생했습니다" };
  }
}

/**
 * 복약 상태 변경 (Server Action)
 * pending → taken / skipped 으로 안전하게 변경
 */
export async function updateMedicationStatus(
  logId: string,
  status: "taken" | "skipped"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "인증되지 않은 사용자입니다" };
    }

    // 본인 로그인지 확인
    const { data: log } = await supabase
      .from("medication_logs")
      .select("id, user_id, status")
      .eq("id", logId)
      .single();

    if (!log) {
      return { success: false, error: "복약 기록을 찾을 수 없습니다" };
    }

    if (log.user_id !== user.id) {
      return { success: false, error: "권한이 없습니다" };
    }

    if (log.status !== "pending") {
      return { success: false, error: "이미 처리된 복약 기록입니다" };
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "taken") {
      updateData.taken_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("medication_logs")
      .update(updateData)
      .eq("id", logId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/medication");
    revalidatePath("/guardian");
    return { success: true };
  } catch (err) {
    console.error("[updateMedicationStatus] 예외:", err);
    return { success: false, error: "서버 오류가 발생했습니다" };
  }
}
