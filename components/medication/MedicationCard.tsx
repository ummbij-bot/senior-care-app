"use client";

import { Check, X, Clock, Pill } from "lucide-react";
import { useConfetti } from "@/lib/hooks/useConfetti";
import VoiceMedicationButton from "./VoiceMedicationButton";

type MedicationCardProps = {
  logId: string;
  medicationName: string;
  dosage: string;
  scheduleLabel: string; // "아침", "점심", "저녁"
  scheduledTime: string; // "08:00"
  status: "taken" | "missed" | "skipped" | "pending";
  takenAt: string | null;
  onTake: (logId: string) => void;
  onSkip: (logId: string) => void;
  isProcessing: boolean;
};

/**
 * 개별 복약 카드
 * - 시니어가 한눈에 상태를 파악할 수 있도록 색상 코딩
 * - '약 먹었어요' 버튼은 최대한 크고 명확하게
 */
export default function MedicationCard({
  logId,
  medicationName,
  dosage,
  scheduleLabel,
  scheduledTime,
  status,
  takenAt,
  onTake,
  onSkip,
  isProcessing,
}: MedicationCardProps) {
  const { fire } = useConfetti();

  // 폭죽 + 햅틱과 함께 복용 처리
  const handleTakeWithConfetti = () => {
    fire();
    onTake(logId);
  };

  // 시간 포맷 (24시→12시간)
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const period = hour < 12 ? "오전" : "오후";
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${display}:${m}`;
  };

  // 복용 완료 시각 포맷
  const formatTakenAt = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${display}:${m}`;
  };

  // 상태별 스타일
  const statusConfig = {
    pending: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      badge: "badge-warning",
      badgeText: "대기 중",
      icon: Clock,
    },
    taken: {
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      badge: "badge-success",
      badgeText: "복용 완료",
      icon: Check,
    },
    missed: {
      border: "border-red-300",
      bg: "bg-red-50",
      badge: "bg-red-100 text-red-800",
      badgeText: "미복용",
      icon: X,
    },
    skipped: {
      border: "border-gray-300",
      bg: "bg-gray-50",
      badge: "bg-gray-200 text-gray-700",
      badgeText: "건너뜀",
      icon: X,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5`}
      role="article"
      aria-label={`${medicationName} ${config.badgeText}`}
    >
      {/* 상단: 약 정보 + 상태 배지 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Pill className="h-6 w-6 text-primary" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              {medicationName}
            </h3>
            <p className="text-base text-text-secondary">
              {dosage} · {scheduleLabel} {formatTime(scheduledTime)}
            </p>
          </div>
        </div>

        {/* 상태 배지 */}
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${config.badge}`}
        >
          <StatusIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          {config.badgeText}
        </span>
      </div>

      {/* 복용 완료 시 시각 표시 */}
      {status === "taken" && takenAt && (
        <p className="mt-3 text-base font-medium text-emerald-700">
          {formatTakenAt(takenAt)}에 복용했습니다
        </p>
      )}

      {/* 대기 중일 때만 액션 버튼 표시 */}
      {status === "pending" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleTakeWithConfetti}
            disabled={isProcessing}
            className="btn btn-primary btn-lg flex-1 text-xl"
            aria-label={`${medicationName} 복용 완료`}
          >
            <Check className="mr-2 h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            약 먹었어요
          </button>

          {/* 음성 인식 버튼 (지원 브라우저만 표시) */}
          <VoiceMedicationButton
            medicationName={medicationName}
            onConfirmed={handleTakeWithConfetti}
            disabled={isProcessing}
          />

          <button
            onClick={() => onSkip(logId)}
            disabled={isProcessing}
            className="btn btn-outline shrink-0"
            aria-label={`${medicationName} 건너뛰기`}
          >
            건너뛰기
          </button>
        </div>
      )}
    </div>
  );
}
