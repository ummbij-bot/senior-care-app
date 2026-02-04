"use client";

/**
 * 스킵 네비게이션 컴포넌트
 * - 키보드 사용자를 위해 본문으로 바로 이동
 * - 포커스 시에만 표시
 */
export default function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-6 focus:py-4 focus:text-lg focus:font-bold focus:text-white focus:shadow-lg"
    >
      본문으로 바로가기
    </a>
  );
}
