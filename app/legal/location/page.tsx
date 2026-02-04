import { ArrowLeft, MapPin } from "lucide-react";

export const metadata = {
  title: "위치기반 서비스 이용약관 - 시니어 건강관리",
};

/**
 * 위치기반 서비스 이용약관 플레이스홀더 페이지
 */
export default function LocationTermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 sm:px-8">
        <a
          href="/login"
          className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface active:scale-95"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
        </a>
        <h1 className="text-2xl font-bold text-text-primary">
          위치기반 서비스 이용약관
        </h1>
      </header>

      <main className="flex-1 px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border-2 border-border bg-surface-raised p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapPin
                className="h-8 w-8 text-primary"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <h2 className="mt-5 text-xl font-bold text-text-primary">
              준비 중입니다
            </h2>
            <p className="mt-2 text-lg text-text-secondary leading-relaxed">
              서비스 출시 전<br />
              업데이트 예정입니다
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
