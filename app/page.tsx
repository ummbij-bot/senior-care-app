import { Pill, Sun, Music, Phone } from "lucide-react";
import CurrentTime from "@/components/CurrentTime";
import FloatingAIButton from "@/components/ai-companion/FloatingAIButton";
import { getCurrentUserOrDemo } from "@/lib/auth/getCurrentUser";
import MembershipBadge from "@/components/membership/MembershipBadge";

/* ============================================
   메인 대시보드 카드 데이터
   ============================================ */
const mainCards = [
  {
    id: "medication",
    icon: Pill,
    label: "복약 알림",
    description: "오늘 먹을 약을 확인해요",
    href: "/medication",
    color: {
      bg: "bg-blue-50",
      iconBg: "bg-primary",
      iconColor: "text-primary-foreground",
      border: "border-blue-200",
    },
  },
  {
    id: "morning",
    icon: Sun,
    label: "오늘 기상",
    description: "기상 시간을 기록해요",
    href: "/morning",
    color: {
      bg: "bg-amber-50",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
      border: "border-amber-200",
    },
  },
  {
    id: "entertainment",
    icon: Music,
    label: "트로트 / 영어",
    description: "음악 듣기와 영어 공부",
    href: "/entertainment",
    color: {
      bg: "bg-emerald-50",
      iconBg: "bg-secondary",
      iconColor: "text-secondary-foreground",
      border: "border-emerald-200",
    },
  },
] as const;

/* ============================================
   메인 대시보드 페이지 (Server Component)
   - Supabase Auth로 현재 사용자 정보 조회
   - 하드코딩 제거, 동적 사용자 이름 표시
   ============================================ */
export default async function Home() {
  // 현재 로그인한 사용자 정보 조회
  const user = await getCurrentUserOrDemo();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ============================================
          상단 영역: 시간 + 환영 문구 + 멤버십 배지
          ============================================ */}
      <header className="px-5 pt-8 pb-6 sm:px-8">
        <div className="flex items-start justify-between">
          <CurrentTime />
          <MembershipBadge userId={user.id} />
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          {user.name} 어르신
          <br />
          <span className="text-primary">안녕하세요</span>
        </h1>
      </header>

      {/* ============================================
          중앙 영역: 3개 메인 기능 카드
          ============================================ */}
      <main className="flex-1 px-5 sm:px-8">
        <section aria-label="주요 기능">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {mainCards.map((card) => {
              const IconComponent = card.icon;

              return (
                <a
                  key={card.id}
                  href={card.href}
                  className={`
                    group flex items-center gap-5 rounded-2xl border-2
                    ${card.color.border} ${card.color.bg}
                    p-5 sm:flex-col sm:items-center sm:p-6 sm:text-center
                    active:scale-95
                  `}
                  aria-label={card.label}
                >
                  {/* 아이콘 원형 배경 */}
                  <div
                    className={`
                      flex h-16 w-16 shrink-0 items-center justify-center
                      rounded-2xl ${card.color.iconBg}
                      sm:h-20 sm:w-20
                    `}
                  >
                    <IconComponent
                      className={`h-8 w-8 ${card.color.iconColor} sm:h-10 sm:w-10`}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </div>

                  {/* 텍스트 */}
                  <div>
                    <p className="text-xl font-bold text-text-primary sm:text-2xl">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-base text-text-secondary sm:mt-1">
                      {card.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      {/* ============================================
          하단 영역: 긴급 신고 버튼 (고정 분리)
          ============================================ */}
      <footer className="sticky bottom-0 border-t-2 border-red-200 bg-background px-5 pb-8 pt-5 sm:px-8">
        <a
          href="/emergency"
          className={`
            group flex w-full items-center justify-center gap-4
            rounded-2xl border-3 border-danger bg-red-50
            px-6 py-5
            active:scale-95
          `}
          role="button"
          aria-label="긴급 신고 - 119에 전화합니다"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-danger">
            <Phone
              className="h-7 w-7 text-danger-foreground"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-danger">긴급 신고</p>
            <p className="text-base font-medium text-danger/80">
              누르면 119에 전화합니다
            </p>
          </div>
        </a>
      </footer>

      {/* AI 손자 플로팅 버튼 */}
      <FloatingAIButton userName={user.name} />
    </div>
  );
}
