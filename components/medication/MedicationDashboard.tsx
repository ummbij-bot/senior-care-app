"use client";

import { useState } from "react";
import { ArrowLeft, Pill, CheckCircle } from "lucide-react";
import { useMedicationLogs } from "@/lib/hooks/useMedicationLogs";
import MedicationCard from "./MedicationCard";

type Props = {
  userId: string;
  userName: string;
};

/**
 * 복약 관리 대시보드 (시니어용)
 * - 오늘의 복약 목록을 시간순으로 표시
 * - 상단에 진행 상황 요약
 * - '약 먹었어요' 큰 버튼으로 즉시 처리
 */
export default function MedicationDashboard({ userId, userName }: Props) {
  const { logs, loading, error, stats, markAsTaken, markAsSkipped } =
    useMedicationLogs(userId);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 복용 처리
  const handleTake = async (logId: string) => {
    setProcessingId(logId);
    await markAsTaken(logId);
    setProcessingId(null);
  };

  // 건너뛰기 처리
  const handleSkip = async (logId: string) => {
    setProcessingId(logId);
    await markAsSkipped(logId);
    setProcessingId(null);
  };

  // 오늘 날짜 포맷
  const today = new Date();
  const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-sm sm:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
            aria-label="홈으로 돌아가기"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">복약 알림</h1>
            <p className="text-base text-text-secondary">
              {userName} 어르신 · {dateString}
            </p>
          </div>
        </div>
      </header>

      {/* ── 진행 상황 요약 ── */}
      <section className="px-5 pt-6 sm:px-8" aria-label="복약 진행 상황">
        <div className="card">
          <div className="flex items-center gap-4">
            {/* 원형 진행률 표시 (간단 버전) */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 34 * (1 - (stats.total > 0 ? stats.taken / stats.total : 0))
                  }`}
                />
              </svg>
              <span className="absolute text-xl font-bold text-text-primary">
                {stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0}%
              </span>
            </div>

            <div className="flex-1">
              <p className="text-xl font-bold text-text-primary">
                {stats.taken === stats.total && stats.total > 0
                  ? "오늘 약을 다 먹었어요!"
                  : `${stats.pending}개 약이 남았어요`}
              </p>
              <div className="mt-2 flex gap-4 text-base">
                <span className="text-emerald-600 font-semibold">
                  완료 {stats.taken}
                </span>
                <span className="text-amber-600 font-semibold">
                  대기 {stats.pending}
                </span>
                {stats.missed > 0 && (
                  <span className="text-red-600 font-semibold">
                    미복용 {stats.missed}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 복약 목록 ── */}
      <main className="flex-1 px-5 py-6 sm:px-8">
        {loading ? (
          // 스켈레톤 로딩
          <div className="space-y-4" aria-label="로딩 중">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-surface" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-32 rounded bg-surface" />
                    <div className="h-4 w-48 rounded bg-surface" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 에러 상태
          <div className="card border-2 border-danger text-center">
            <p className="text-xl font-bold text-danger">오류가 발생했어요</p>
            <p className="mt-1 text-base text-text-secondary">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          // 빈 상태
          <div className="card text-center py-12">
            <Pill className="mx-auto h-12 w-12 text-text-muted" strokeWidth={1.5} />
            <p className="mt-4 text-xl font-bold text-text-primary">
              오늘 복용할 약이 없어요
            </p>
            <p className="mt-1 text-base text-text-secondary">
              약 스케줄을 등록해 주세요
            </p>
          </div>
        ) : (
          // 약 목록
          <div className="space-y-4">
            {/* 대기 중인 약 먼저 */}
            {logs
              .sort((a, b) => {
                const order = { pending: 0, missed: 1, taken: 2, skipped: 3 };
                return order[a.status] - order[b.status];
              })
              .map((log) => (
                <MedicationCard
                  key={log.id}
                  logId={log.id}
                  medicationName={log.medications?.name ?? "알 수 없는 약"}
                  dosage={log.medications?.dosage ?? ""}
                  scheduleLabel={log.medication_schedules?.label ?? ""}
                  scheduledTime={log.scheduled_time}
                  status={log.status}
                  takenAt={log.taken_at}
                  onTake={handleTake}
                  onSkip={handleSkip}
                  isProcessing={processingId === log.id}
                />
              ))}
          </div>
        )}

        {/* 모두 완료 시 축하 메시지 */}
        {!loading && stats.taken === stats.total && stats.total > 0 && (
          <div className="mt-6 card border-2 border-emerald-300 bg-emerald-50 text-center py-8">
            <CheckCircle
              className="mx-auto h-16 w-16 text-emerald-500"
              strokeWidth={1.8}
            />
            <p className="mt-4 text-2xl font-bold text-emerald-700">
              훌륭해요!
            </p>
            <p className="mt-1 text-lg text-emerald-600">
              오늘의 약을 모두 복용했습니다
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
