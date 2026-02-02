"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import type { MedicationLog } from "@/lib/types/database";

type LogWithDetails = MedicationLog & {
  medications: { name: string; dosage: string } | null;
  medication_schedules: { label: string } | null;
};

type SeniorInfo = {
  id: string;
  name: string;
  phone: string | null;
};

/**
 * 보호자용 실시간 모니터링 훅
 * - 시니어의 오늘 복약 로그를 실시간 구독
 * - 상태 변경 시 즉시 UI 반영
 * - 마지막 업데이트 시각 표시
 */
export function useGuardianRealtime(seniorId: string) {
  const [senior, setSenior] = useState<SeniorInfo | null>(null);
  const [logs, setLogs] = useState<LogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // ── 시니어 정보 + 오늘 로그 가져오기 ──
  const fetchData = useCallback(async () => {
    setLoading(true);

    // 시니어 프로필
    const { data: seniorData } = await supabase
      .from("profiles")
      .select("id, name, phone")
      .eq("id", seniorId)
      .single();

    if (seniorData) {
      setSenior(seniorData);
    }

    // 오늘의 복약 로그
    const { data: logsData } = await supabase
      .from("medication_logs")
      .select(`
        *,
        medications (name, dosage),
        medication_schedules (label)
      `)
      .eq("user_id", seniorId)
      .eq("scheduled_date", today)
      .order("scheduled_time", { ascending: true });

    if (logsData) {
      setLogs(logsData as LogWithDetails[]);
      setLastUpdate(new Date());
    }

    setLoading(false);
  }, [seniorId, today]);

  // ── 초기 로드 ──
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime 구독 ──
  useEffect(() => {
    const channel = supabase
      .channel(`guardian-watch-${seniorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // 상태 변경만 감지 (taken, missed 등)
          schema: "public",
          table: "medication_logs",
          filter: `user_id=eq.${seniorId}`,
        },
        (payload) => {
          console.log("[Realtime] 복약 상태 변경:", payload);
          setLastUpdate(new Date());
          // 전체 재조회 (JOIN 데이터 포함)
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seniorId, fetchData]);

  // ── 통계 ──
  const stats = {
    total: logs.length,
    taken: logs.filter((l) => l.status === "taken").length,
    pending: logs.filter((l) => l.status === "pending").length,
    missed: logs.filter((l) => l.status === "missed").length,
    skipped: logs.filter((l) => l.status === "skipped").length,
  };

  return { senior, logs, loading, stats, lastUpdate, refetch: fetchData };
}
