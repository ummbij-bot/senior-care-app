"use client";

import { useState, useEffect } from "react";

export default function CurrentTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // 초기 렌더링 시 즉시 시간 설정 (hydration mismatch 방지)
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) {
    // SSR / 초기 hydration 시 깜빡임 방지용 스켈레톤
    return (
      <div className="space-y-1">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-6 w-36 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  // 한국어 요일
  const dayNames = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = dayNames[now.getDay()];

  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return (
    <div className="space-y-0.5">
      {/* 시간 - 가장 큰 텍스트 */}
      <p className="text-4xl font-bold tracking-tight text-text-primary">
        {period} {displayHour}:{minutes}
      </p>
      {/* 날짜 */}
      <p className="text-lg text-text-secondary">
        {year}년 {month}월 {date}일 {day}
      </p>
    </div>
  );
}
