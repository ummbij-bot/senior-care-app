"use client";

import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import AIChatModal from "./AIChatModal";

const PROACTIVE_MESSAGES = [
  "오늘 날씨가 참 좋아요. 산책 어떠세요?",
  "오늘 하루도 건강하게 보내세요!",
  "약 드시는 거 잊지 마세요!",
  "오늘도 좋은 하루 되세요!",
  "혹시 도움이 필요하시면 말씀해 주세요!",
];

/**
 * AI 손자 플로팅 버튼 + 선제적 말풍선
 * - 메인 대시보드 우측 하단에 항상 표시
 * - 30초 후 자동으로 관심 말풍선 표시
 * - 클릭 시 채팅 모달 열기
 */
export default function FloatingAIButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  // 30초 후 선제적 말풍선 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      const msg =
        PROACTIVE_MESSAGES[
          Math.floor(Math.random() * PROACTIVE_MESSAGES.length)
        ];
      setProactiveMessage(msg);
      setShowBubble(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

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
        <div className="fixed bottom-40 right-5 z-40 max-w-[240px] sm:bottom-44 sm:right-8">
          <div className="relative rounded-2xl border border-border bg-surface-raised px-4 py-3 shadow-lg">
            <button
              onClick={() => setShowBubble(false)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border"
              aria-label="말풍선 닫기"
            >
              <X className="h-3 w-3 text-text-muted" strokeWidth={3} />
            </button>
            <p className="text-base font-medium text-text-primary">
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
      {isModalOpen && <AIChatModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
