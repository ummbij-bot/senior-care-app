"use client";

import {
  ArrowLeft,
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  Ear,
} from "lucide-react";
import { useDailyEnglish } from "@/lib/hooks/useDailyEnglish";

/**
 * 오늘의 한마디 영어
 * - 큰 글씨로 영어 + 한국어 + 발음 표시
 * - Web Speech API로 음성 재생
 * - '영어 듣기', '한국어 듣기', '둘 다 듣기' 대형 버튼
 */
export default function DailyEnglish() {
  const { item, loading, todayDayNumber, isSpeaking, speak, speakBoth, stopSpeaking } =
    useDailyEnglish();

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 px-5 pt-6 pb-4">
          <a href="/entertainment" className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface">
            <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </a>
          <h1 className="text-2xl font-bold text-text-primary">오늘의 영어</h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <BookOpen className="mx-auto h-16 w-16 animate-pulse text-text-muted" />
            <p className="mt-4 text-xl text-text-secondary">오늘의 영어를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
        <BookOpen className="h-16 w-16 text-text-muted" />
        <p className="mt-4 text-xl font-bold text-text-primary">오늘의 영어가 없어요</p>
      </div>
    );
  }

  // 카테고리별 색상
  const categoryColors: Record<string, string> = {
    인사: "bg-blue-100 text-blue-800",
    감사: "bg-pink-100 text-pink-800",
    일상: "bg-amber-100 text-amber-800",
    건강: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── 헤더 ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4 sm:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/entertainment"
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
            aria-label="돌아가기"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">오늘의 영어</h1>
            <p className="text-base text-text-secondary">Day {todayDayNumber} / 30</p>
          </div>
        </div>
        <span
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            categoryColors[item.category] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {item.category}
        </span>
      </header>

      {/* ── 메인 카드: 오늘의 표현 ── */}
      <main className="flex-1 px-5 sm:px-8">
        <div className="card border-2 border-primary py-8 text-center">
          {/* 영어 (가장 큰 텍스트) */}
          <p className="text-4xl font-bold leading-tight text-primary sm:text-5xl">
            {item.english_text}
          </p>

          {/* 발음 가이드 */}
          <p className="mt-4 text-2xl text-text-secondary">
            [ {item.pronunciation} ]
          </p>

          {/* 한국어 뜻 */}
          <p className="mt-3 text-2xl font-semibold text-text-primary">
            {item.korean_text}
          </p>

          {/* 음성 재생 상태 표시 */}
          {isSpeaking && (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary">
              <Ear className="h-5 w-5 animate-pulse" />
              <span className="text-lg font-medium">재생 중...</span>
            </div>
          )}
        </div>

        {/* ── 음성 버튼 (초대형) ── */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 영어 듣기 */}
          <button
            onClick={() => speak(item.english_text, "en-US")}
            disabled={isSpeaking}
            className="btn btn-primary btn-lg flex-col gap-2 py-6"
          >
            <Volume2 className="h-9 w-9" strokeWidth={2} />
            <span className="text-lg font-bold">영어 듣기</span>
          </button>

          {/* 한국어 듣기 */}
          <button
            onClick={() => speak(item.korean_text, "ko-KR")}
            disabled={isSpeaking}
            className="btn btn-secondary btn-lg flex-col gap-2 py-6"
          >
            <Volume2 className="h-9 w-9" strokeWidth={2} />
            <span className="text-lg font-bold">한국어 듣기</span>
          </button>

          {/* 둘 다 듣기 */}
          <button
            onClick={speakBoth}
            disabled={isSpeaking}
            className="btn btn-outline btn-lg flex-col gap-2 py-6"
          >
            <RotateCcw className="h-9 w-9 text-text-primary" strokeWidth={2} />
            <span className="text-lg font-bold">둘 다 듣기</span>
          </button>
        </div>

        {/* 재생 중지 버튼 */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="btn btn-danger mt-3 w-full"
          >
            <VolumeX className="mr-2 h-5 w-5" />
            멈추기
          </button>
        )}

        {/* ── 예문 카드 ── */}
        {item.example_sentence && (
          <div className="card mt-6">
            <h3 className="text-lg font-bold text-text-primary">예문</h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => speak(item.example_sentence!, "en-US")}
                className="flex w-full items-center gap-3 rounded-xl bg-blue-50 p-4 text-left"
              >
                <Volume2 className="h-6 w-6 shrink-0 text-primary" />
                <p className="text-xl font-semibold text-primary">
                  {item.example_sentence}
                </p>
              </button>
              <p className="px-4 text-lg text-text-secondary">{item.example_korean}</p>
            </div>
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-8" />
      </main>
    </div>
  );
}
