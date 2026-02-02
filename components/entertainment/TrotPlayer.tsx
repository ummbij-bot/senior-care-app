"use client";

import { useState } from "react";
import {
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  Music,
  List,
  ArrowLeft,
} from "lucide-react";
import { useTrotPlaylist } from "@/lib/hooks/useTrotPlaylist";

/**
 * 트로트 전용 플레이어
 * - YouTube IFrame API로 앱 내 재생
 * - 초대형 이전/다음/크게보기 버튼
 * - 곡 목록 토글
 */
export default function TrotPlayer() {
  const { songs, currentSong, currentIndex, loading, nextSong, prevSong, goToSong } =
    useTrotPlaylist();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 px-5 pt-6 pb-4">
          <a href="/entertainment" className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface">
            <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </a>
          <h1 className="text-2xl font-bold text-text-primary">트로트</h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Music className="mx-auto h-16 w-16 animate-pulse text-text-muted" />
            <p className="mt-4 text-xl text-text-secondary">노래를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
        <Music className="h-16 w-16 text-text-muted" />
        <p className="mt-4 text-xl font-bold text-text-primary">등록된 노래가 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── 헤더 ── */}
      {!isExpanded && (
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
              <h1 className="text-2xl font-bold text-text-primary">트로트</h1>
              <p className="text-base text-text-secondary">
                {currentIndex + 1} / {songs.length}곡
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="btn btn-outline"
            aria-label="곡 목록"
          >
            <List className="mr-1.5 h-5 w-5" />
            목록
          </button>
        </header>
      )}

      {/* ── 비디오 플레이어 ── */}
      <div className={`${isExpanded ? "fixed inset-0 z-50 bg-black" : "px-5 sm:px-8"}`}>
        <div
          className={`relative w-full overflow-hidden rounded-2xl bg-black ${
            isExpanded ? "h-full rounded-none" : "aspect-video"
          }`}
        >
          <iframe
            key={currentSong.youtube_id}
            src={`https://www.youtube.com/embed/${currentSong.youtube_id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${currentSong.title} - ${currentSong.artist}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>

        {/* 크게보기 모드에서 닫기 버튼 */}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute right-4 top-4 z-60 flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="크게보기 닫기"
          >
            <Minimize className="h-7 w-7" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── 곡 정보 ── */}
      {!isExpanded && (
        <>
          <div className="px-5 pt-5 sm:px-8">
            <h2 className="text-2xl font-bold text-text-primary">{currentSong.title}</h2>
            <p className="mt-1 text-lg text-text-secondary">{currentSong.artist}</p>
          </div>

          {/* ── 컨트롤 버튼 (초대형) ── */}
          <div className="flex-1 px-5 pt-6 sm:px-8">
            <div className="grid grid-cols-3 gap-4">
              {/* 이전 곡 */}
              <button
                onClick={prevSong}
                className="btn btn-outline btn-lg flex-col gap-2 py-6"
                aria-label="이전 곡"
              >
                <SkipBack className="h-10 w-10 text-text-primary" strokeWidth={2} />
                <span className="text-lg font-bold">이전 곡</span>
              </button>

              {/* 크게 보기 */}
              <button
                onClick={() => setIsExpanded(true)}
                className="btn btn-primary btn-lg flex-col gap-2 py-6"
                aria-label="크게 보기"
              >
                <Maximize className="h-10 w-10" strokeWidth={2} />
                <span className="text-lg font-bold">크게 보기</span>
              </button>

              {/* 다음 곡 */}
              <button
                onClick={nextSong}
                className="btn btn-outline btn-lg flex-col gap-2 py-6"
                aria-label="다음 곡"
              >
                <SkipForward className="h-10 w-10 text-text-primary" strokeWidth={2} />
                <span className="text-lg font-bold">다음 곡</span>
              </button>
            </div>
          </div>

          {/* ── 곡 목록 (토글) ── */}
          {showPlaylist && (
            <div className="px-5 pb-6 sm:px-8">
              <h3 className="mb-3 text-xl font-bold text-text-primary">곡 목록</h3>
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      goToSong(index);
                      setShowPlaylist(false);
                    }}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left ${
                      index === currentIndex
                        ? "border-primary bg-blue-50"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                        index === currentIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-text-muted"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{song.title}</p>
                      <p className="text-base text-text-secondary">{song.artist}</p>
                    </div>
                    {index === currentIndex && (
                      <Music className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 하단 여백 */}
          <div className="h-8" />
        </>
      )}
    </div>
  );
}
