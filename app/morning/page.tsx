"use client";

import { Sun, ArrowLeft, Check, Clock, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useConfetti } from "@/lib/hooks/useConfetti";

/**
 * 오늘 기상 페이지
 * - 기상 버튼을 누르면 오늘 기상 시간 기록
 * - 최근 7일 기상 기록 표시
 * - 햅틱 피드백 + 폭죽 효과
 */
export default function MorningPage() {
  const { fire } = useConfetti();
  const [todayChecked, setTodayChecked] = useState(false);
  const [checkTime, setCheckTime] = useState<Date | null>(null);
  const [recentDays, setRecentDays] = useState<{ date: string; time: string | null }[]>([]);

  // 로컬 스토리지에서 기록 불러오기
  useEffect(() => {
    const stored = localStorage.getItem("morning-checks");
    if (stored) {
      const data = JSON.parse(stored) as Record<string, string>;
      const today = new Date().toISOString().split("T")[0];

      if (data[today]) {
        setTodayChecked(true);
        setCheckTime(new Date(data[today]));
      }

      // 최근 7일 데이터 생성
      const days: { date: string; time: string | null }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        days.push({
          date: dateStr,
          time: data[dateStr] || null,
        });
      }
      setRecentDays(days);
    } else {
      // 빈 7일 데이터
      const days: { date: string; time: string | null }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          date: d.toISOString().split("T")[0],
          time: null,
        });
      }
      setRecentDays(days);
    }
  }, []);

  const handleWakeUp = () => {
    if (todayChecked) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 로컬 스토리지에 저장
    const stored = localStorage.getItem("morning-checks");
    const data = stored ? JSON.parse(stored) : {};
    data[today] = now.toISOString();
    localStorage.setItem("morning-checks", JSON.stringify(data));

    setTodayChecked(true);
    setCheckTime(now);

    // 최근 기록 업데이트
    setRecentDays((prev) =>
      prev.map((d) => (d.date === today ? { ...d, time: now.toISOString() } : d))
    );

    // 폭죽 효과
    fire({ particleCount: 100, spread: 80 });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${display}:${m}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateStr === today) return "오늘";
    if (dateStr === yesterdayStr) return "어제";
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[d.getDay()];
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="flex items-center gap-3 border-b border-border px-5 pt-6 pb-4 sm:px-8">
        <a
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
          aria-label="홈으로"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">오늘 기상</h1>
          <p className="text-base text-text-secondary">일어나셨으면 버튼을 눌러주세요</p>
        </div>
      </header>

      {/* 메인 기상 버튼 */}
      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="flex flex-col items-center text-center">
          {todayChecked ? (
            <>
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-16 w-16 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-emerald-600">
                좋은 아침이에요!
              </h2>
              <p className="mt-2 text-xl text-text-secondary">
                오늘도 건강한 하루 보내세요
              </p>
              {checkTime && (
                <p className="mt-4 text-lg text-text-muted">
                  <Clock className="mr-1.5 inline-block h-5 w-5" />
                  {formatTime(checkTime.toISOString())}에 일어나셨어요
                </p>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleWakeUp}
                className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg active:scale-95 sm:h-48 sm:w-48"
                aria-label="기상 체크"
              >
                <Sun className="h-20 w-20 text-white sm:h-24 sm:w-24" strokeWidth={2} />
              </button>
              <h2 className="mt-6 text-3xl font-bold text-text-primary">
                일어나셨나요?
              </h2>
              <p className="mt-2 text-xl text-text-secondary">
                버튼을 눌러 기상을 기록하세요
              </p>
            </>
          )}
        </div>

        {/* 최근 7일 기록 */}
        <section className="mt-12">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-text-primary">
            <Calendar className="h-5 w-5" />
            최근 기록
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {recentDays.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col items-center rounded-xl p-3 ${
                  day.time
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-surface border border-border"
                }`}
              >
                <span className="text-sm font-medium text-text-muted">
                  {getDayName(day.date)}
                </span>
                <span className="mt-1 text-lg font-bold text-text-primary">
                  {formatDate(day.date)}
                </span>
                {day.time ? (
                  <Check className="mt-2 h-5 w-5 text-emerald-500" strokeWidth={2.5} />
                ) : (
                  <span className="mt-2 h-5 w-5 text-center text-text-muted">-</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
