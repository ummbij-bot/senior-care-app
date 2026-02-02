"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import type { MedicationLog } from "@/lib/types/database";

type LogWithMedication = MedicationLog & {
  medications: { name: string; dosage: string } | null;
  medication_schedules: { label: string } | null;
};

/**
 * 오늘의 복약 로그를 실시간으로 관리하는 훅
 * - 초기 로드: 오늘 날짜의 모든 로그 fetch
 * - 실시간: Supabase Realtime으로 변경 감지
 * - 복용 처리: '약 먹었어요' 버튼 핸들러
 */
export function useMedicationLogs(userId: string) {
  const [logs, setLogs] = useState<LogWithMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0]; // "2026-02-02"

  // ── 오늘의 로그 가져오기 ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("medication_logs")
      .select(
        `
        *,
        medications (name, dosage),
        medication_schedules (label)
        `
      )
      .eq("user_id", userId)
      .eq("scheduled_date", today)
      .order("scheduled_time", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLogs((data as LogWithMedication[]) ?? []);
    }
    setLoading(false);
  }, [userId, today]);

  // ── '약 먹었어요' 버튼 처리 ──
  const markAsTaken = useCallback(
    async (logId: string) => {
      const { error: updateError } = await supabase
        .from("medication_logs")
        .update({
          status: "taken",
          taken_at: new Date().toISOString(),
        })
        .eq("id", logId)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }
      return true;
    },
    [userId]
  );

  // ── 건너뛰기 처리 ──
  const markAsSkipped = useCallback(
    async (logId: string) => {
      const { error: updateError } = await supabase
        .from("medication_logs")
        .update({ status: "skipped" })
        .eq("id", logId)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }
      return true;
    },
    [userId]
  );

  // ── 초기 로드 ──
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Realtime 구독 (medication_logs 변경 감지) ──
  useEffect(() => {
    const channel = supabase
      .channel(`logs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모두 감지
          schema: "public",
          table: "medication_logs",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // 변경 감지 시 전체 재조회 (JOIN 데이터 포함)
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchLogs]);

  // ── 통계 계산 ──
  const stats = {
    total: logs.length,
    taken: logs.filter((l) => l.status === "taken").length,
    pending: logs.filter((l) => l.status === "pending").length,
    missed: logs.filter((l) => l.status === "missed").length,
  };

  return { logs, loading, error, stats, markAsTaken, markAsSkipped, refetch: fetchLogs };
}
