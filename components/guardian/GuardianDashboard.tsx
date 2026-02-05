"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  SkipForward,
  Activity,
  BarChart3,
} from "lucide-react";
import { useGuardianRealtime } from "@/lib/hooks/useGuardianRealtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  seniorId: string;
};

type DailyReport = {
  report_date: string;
  total_count: number;
  taken_count: number;
  success_rate: number;
};

/**
 * 보호자 대시보드
 * - 시니어의 오늘 복약 현황을 실시간 모니터링
 * - Supabase Realtime으로 상태 변경 즉시 반영
 * - 지난 7일 주간 복약 리포트 (Progress Bar 시각화)
 */
export default function GuardianDashboard({ seniorId }: Props) {
  const { senior, logs, loading, stats, lastUpdate, refetch } =
    useGuardianRealtime(seniorId);

  const [weeklyReport, setWeeklyReport] = useState<DailyReport[]>([]);
  const [reportLoading, setReportLoading] = useState(true);

  // 주간 리포트 조회
  const fetchWeeklyReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const { data } = await supabase
        .from("medication_logs")
        .select("scheduled_date, status")
        .eq("user_id", seniorId)
        .gte("scheduled_date", startStr)
        .lte("scheduled_date", endStr);

      if (data) {
        // 7일 빈 데이터 초기화
        const grouped = new Map<string, { total: number; taken: number }>();
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = d.toISOString().split("T")[0];
          grouped.set(key, { total: 0, taken: 0 });
        }

        data.forEach((log) => {
          const existing = grouped.get(log.scheduled_date) || { total: 0, taken: 0 };
          existing.total += 1;
          if (log.status === "taken") existing.taken += 1;
          grouped.set(log.scheduled_date, existing);
        });

        const report: DailyReport[] = [];
        grouped.forEach((value, key) => {
          report.push({
            report_date: key,
            total_count: value.total,
            taken_count: value.taken,
            success_rate: value.total > 0
              ? Math.round((value.taken / value.total) * 100)
              : 0,
          });
        });

        report.sort((a, b) => a.report_date.localeCompare(b.report_date));
        setWeeklyReport(report);
      }
    } catch (err) {
      console.error("[주간 리포트] 조회 실패:", err);
    } finally {
      setReportLoading(false);
    }
  }, [seniorId]);

  useEffect(() => {
    fetchWeeklyReport();
  }, [fetchWeeklyReport]);

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const period = hour < 12 ? "오전" : "오후";
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${display}:${m}`;
  };

  const formatLastUpdate = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const s = date.getSeconds().toString().padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${display}:${m}:${s}`;
  };

  /** 날짜 → "2/4(화)" 형식 */
  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = dayNames[d.getDay()];
    return `${month}/${day}(${dayName})`;
  };

  // 주간 평균 성공률
  const daysWithData = weeklyReport.filter((r) => r.total_count > 0);
  const weeklyAverage =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((sum, r) => sum + r.success_rate, 0) / daysWithData.length)
      : 0;

  const statusConfig = {
    taken: {
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "복용 완료",
    },
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "대기 중",
    },
    missed: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "미복용",
    },
    skipped: {
      icon: SkipForward,
      color: "text-gray-500",
      bg: "bg-gray-50",
      border: "border-gray-200",
      label: "건너뜀",
    },
  };

  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-sm sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
              aria-label="홈으로"
            >
              <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">보호자 대시보드</h1>
              <p className="text-sm text-text-secondary">{dateString}</p>
            </div>
          </div>
          <button
            onClick={() => {
              refetch();
              fetchWeeklyReport();
            }}
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
            aria-label="새로고침"
          >
            <RefreshCw className="h-5 w-5 text-text-muted" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 sm:px-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 w-40 rounded bg-surface" />
                <div className="mt-2 h-4 w-60 rounded bg-surface" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── 시니어 정보 + 실시간 상태 ── */}
            <section className="card border-2 border-primary">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Activity className="h-8 w-8 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {senior?.name ?? "어르신"} 어르신
                  </h2>
                  {senior?.phone && (
                    <p className="text-base text-text-secondary">{senior.phone}</p>
                  )}
                  {lastUpdate && (
                    <p className="mt-1 text-sm text-text-muted">
                      마지막 업데이트: {formatLastUpdate(lastUpdate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-sm font-medium text-emerald-600">실시간</span>
                </div>
              </div>
            </section>

            {/* ── 요약 통계 ── */}
            <section aria-label="복약 통계">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.taken}</p>
                  <p className="mt-1 text-sm font-medium text-text-secondary">복용 완료</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="mt-1 text-sm font-medium text-text-secondary">대기 중</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.missed}</p>
                  <p className="mt-1 text-sm font-medium text-text-secondary">미복용</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
                  <p className="mt-1 text-sm font-medium text-text-secondary">전체</p>
                </div>
              </div>
            </section>

            {/* ── 주간 복약 리포트 (Progress Bar) ── */}
            <section aria-label="주간 복약 리포트">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2} />
                <h3 className="text-xl font-bold text-text-primary">주간 복약 리포트</h3>
                {!reportLoading && weeklyAverage > 0 && (
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-sm font-bold ${
                      weeklyAverage >= 80
                        ? "bg-emerald-100 text-emerald-700"
                        : weeklyAverage >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    평균 {weeklyAverage}%
                  </span>
                )}
              </div>

              {reportLoading ? (
                <div className="card animate-pulse">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="h-8 rounded bg-surface" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="space-y-3">
                    {weeklyReport.map((day) => {
                      const isToday =
                        day.report_date === new Date().toISOString().split("T")[0];
                      const rate = day.success_rate;
                      const barColor =
                        rate >= 80
                          ? "bg-emerald-500"
                          : rate >= 50
                            ? "bg-amber-500"
                            : rate > 0
                              ? "bg-red-400"
                              : "bg-gray-200";

                      return (
                        <div key={day.report_date}>
                          <div className="mb-1 flex items-center justify-between">
                            <span
                              className={`text-sm font-medium ${
                                isToday ? "font-bold text-primary" : "text-text-secondary"
                              }`}
                            >
                              {formatShortDate(day.report_date)}
                              {isToday && " (오늘)"}
                            </span>
                            <span className="text-sm font-bold text-text-primary">
                              {day.total_count > 0
                                ? `${day.taken_count}/${day.total_count} (${rate}%)`
                                : "기록 없음"}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${day.total_count > 0 ? Math.max(rate, 2) : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {weeklyReport.every((d) => d.total_count === 0) && (
                    <p className="mt-4 text-center text-base text-text-muted">
                      최근 7일간 복약 기록이 없습니다
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ── 타임라인 ── */}
            <section aria-label="복약 타임라인">
              <h3 className="mb-4 text-xl font-bold text-text-primary">오늘의 복약 기록</h3>
              <div className="space-y-3">
                {logs.map((log) => {
                  const config = statusConfig[log.status];
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={log.id}
                      className={`flex items-center gap-4 rounded-xl border-2 ${config.border} ${config.bg} p-4`}
                    >
                      <StatusIcon
                        className={`h-8 w-8 shrink-0 ${config.color}`}
                        strokeWidth={2}
                      />
                      <div className="flex-1">
                        <p className="text-lg font-bold text-text-primary">
                          {log.medications?.name ?? "약"}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {log.medication_schedules?.label} {formatTime(log.scheduled_time)}
                          {" · "}
                          {log.medications?.dosage}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        {log.status === "taken" && log.taken_at && (
                          <p className="text-xs text-text-muted">
                            {new Date(log.taken_at).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
