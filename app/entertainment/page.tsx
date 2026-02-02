import { Music, BookOpen, ArrowLeft } from "lucide-react";

/**
 * /entertainment 메인 페이지
 * 트로트 / 영어 선택 화면
 */
export default function EntertainmentPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="px-5 pt-8 pb-6 sm:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface"
            aria-label="홈으로"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </a>
          <h1 className="text-3xl font-bold text-text-primary">트로트 / 영어</h1>
        </div>
        <p className="mt-2 pl-15 text-lg text-text-secondary">
          즐겁게 듣고 배워보세요
        </p>
      </header>

      {/* 선택 카드 */}
      <main className="flex-1 px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* 트로트 */}
          <a
            href="/entertainment/trot"
            className="group card border-2 border-amber-200 bg-amber-50 py-10 text-center active:scale-[0.98]"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500">
              <Music className="h-12 w-12 text-white" strokeWidth={2} />
            </div>
            <h2 className="mt-5 text-3xl font-bold text-text-primary">트로트 듣기</h2>
            <p className="mt-2 text-lg text-text-secondary">
              좋아하는 노래를 들어보세요
            </p>
          </a>

          {/* 오늘의 영어 */}
          <a
            href="/entertainment/english"
            className="group card border-2 border-emerald-200 bg-emerald-50 py-10 text-center active:scale-[0.98]"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary">
              <BookOpen className="h-12 w-12 text-white" strokeWidth={2} />
            </div>
            <h2 className="mt-5 text-3xl font-bold text-text-primary">오늘의 영어</h2>
            <p className="mt-2 text-lg text-text-secondary">
              매일 한마디씩 배워보세요
            </p>
          </a>
        </div>
      </main>

      <div className="h-8" />
    </div>
  );
}
