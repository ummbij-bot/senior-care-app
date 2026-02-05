"use client";

import { MessageCircle, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import AIChatModal from "./AIChatModal";

type Props = {
  userName?: string;
  userId?: string;
};

/**
 * 복약 데이터를 분석하여 선제적 칭찬/격려 메시지 생성
 */
async function generateProactiveMessage(
  userId: string | undefined,
  name: string
): Promise<string> {
  if (!userId) {
    return `${name} 어르신, 오늘도 건강한 하루 보내세요!`;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];

    // 오늘의 복약 로그 조회
    const { data: todayLogs } = await supabase
      .from("medication_logs")
      .select("status")
      .eq("user_id", userId)
      .eq("scheduled_date", today);

    if (!todayLogs || todayLogs.length === 0) {
      const hour = new Date().getHours();
      if (hour < 10) return `${name} 어르신, 좋은 아침이에요! 오늘도 힘찬 하루 시작하세요!`;
      if (hour < 14) return `${name} 어르신, 점심 식사는 하셨나요? 건강이 최고예요!`;
      return `${name} 어르신, 오늘 하루도 수고하셨어요!`;
    }

    const taken = todayLogs.filter((l) => l.status === "taken").length;
    const total = todayLogs.length;
    const pending = todayLogs.filter((l) => l.status === "pending").length;

    // 모두 복용 완료
    if (taken === total) {
      return `${name} 어르신, 오늘 약을 전부 드셨네요! 정말 대단해요! 💪`;
    }

    // 일부 복용 완료
    if (taken > 0) {
      return `${name} 어르신, 오늘 벌써 ${taken}개나 드셨어요! 멋져요!`;
    }

    // 아직 아무것도 안 드심
    if (pending > 0) {
      return `${name} 어르신, 오늘 드실 약이 ${pending}개 있어요. 건강을 위해 챙겨주세요!`;
    }

    return `${name} 어르신, 오늘도 건강한 하루 보내세요!`;
  } catch {
    return `${name} 어르신, 식사는 하셨나요?`;
  }
}

/**
 * AI 손자 플로팅 버튼 + 선제적 말풍선
 * - 메인 대시보드 우측 하단에 항상 표시
 * - 10초 비활동 시 복약 데이터 분석 기반 선제적 칭찬 메시지 표시
 * - 활동 감지 시 타이머 리셋
 * - 클릭 시 채팅 모달 열기
 */
export default function FloatingAIButton({ userName, userId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  // 10초 비활동 감지 → 말풍선 표시
  const resetTimer = useCallback(() => {
    setShowBubble(false);
  }, []);

  useEffect(() => {
    const name = userName || "어르신";
    const INACTIVITY_DELAY = 10000; // 10초

    let timer: ReturnType<typeof setTimeout>;

    const startTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const msg = await generateProactiveMessage(userId, name);
        setProactiveMessage(msg);
        setShowBubble(true);
      }, INACTIVITY_DELAY);
    };

    const handleActivity = () => {
      resetTimer();
      startTimer();
    };

    // 사용자 활동 감지 이벤트
    const events = ["click", "scroll", "keydown", "touchstart", "mousemove"];
    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    // 초기 타이머 시작
    startTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [userName, userId, resetTimer]);

  // 말풍선 자동 숨김 (15초 후)
  useEffect(() => {
    if (!showBubble) return;
    const timer = setTimeout(() => setShowBubble(false), 15000);
    return () => clearTimeout(timer);
  }, [showBubble]);

  const handleOpen = () => {
    setShowBubble(false);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* 선제적 말풍선 */}
      {showBubble && proactiveMessage && !isModalOpen && (
        <div className="fixed bottom-40 right-5 z-40 max-w-[260px] sm:bottom-44 sm:right-8">
          <div className="relative rounded-2xl border border-border bg-surface-raised px-4 py-3 shadow-lg">
            <button
              onClick={() => setShowBubble(false)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border"
              aria-label="말풍선 닫기"
            >
              <X className="h-3 w-3 text-text-muted" strokeWidth={3} />
            </button>
            <p className="text-base font-medium text-text-primary leading-relaxed">
              {proactiveMessage}
            </p>
            <p className="mt-1 text-sm text-text-muted">- AI 손자</p>
            {/* 꼬리 삼각형 */}
            <div className="absolute -bottom-2 right-8 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-surface-raised" />
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={handleOpen}
        className="
          fixed bottom-24 right-5 z-40
          flex h-16 w-16 items-center justify-center
          rounded-full bg-gradient-to-br from-primary to-primary-hover
          shadow-lg hover:shadow-xl
          active:scale-95
          sm:bottom-28 sm:right-8 sm:h-20 sm:w-20
        "
        aria-label="AI 손자와 대화하기"
        title="AI 손자"
      >
        <MessageCircle
          className="h-8 w-8 text-primary-foreground sm:h-10 sm:w-10"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>

      {/* 채팅 모달 */}
      {isModalOpen && (
        <AIChatModal onClose={() => setIsModalOpen(false)} userName={userName} />
      )}
    </>
  );
}
