"use client";

import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";

type Props = {
  medicationName: string;
  onConfirmed: () => void;
  disabled?: boolean;
};

/**
 * 음성 복약 확인 버튼
 * - 마이크 아이콘, listening 시 pulse 애니메이션
 * - "약 먹었다" 인식 → onConfirmed 호출 + TTS 응답
 * - 미지원 브라우저에서는 렌더링하지 않음
 */
export default function VoiceMedicationButton({
  medicationName,
  onConfirmed,
  disabled = false,
}: Props) {
  const { isListening, isSupported, startListening, stopListening, speak } =
    useSpeechRecognition(() => {
      onConfirmed();
      // TTS 응답
      speak(`네, ${medicationName} 복용 확인했습니다. 오늘도 건강한 하루 되세요!`);
    });

  if (!isSupported) return null;

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`
        btn btn-outline shrink-0 relative overflow-hidden
        ${isListening ? "border-primary bg-primary/5" : ""}
      `}
      aria-label={
        isListening
          ? "듣는 중 - 중지하려면 누르세요"
          : "음성으로 복용 확인 - '약 먹었어요' 말하기"
      }
      title={isListening ? "듣는 중..." : "'약 먹었어요' 말하기"}
    >
      {isListening ? (
        <>
          <span className="absolute inset-0 rounded-[inherit] animate-ping border-2 border-primary opacity-30" />
          <MicOff
            className="h-6 w-6 relative z-10 text-primary"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </>
      ) : (
        <Mic className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
      )}
    </button>
  );
}
