"use client";

import { X, Send, User, Bot, Trash2, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string for serialization
};

const STORAGE_KEY = "senior-care-chat-history";
const MAX_MESSAGES = 50;

const AUTO_REPLIES = [
  "네, 알겠습니다! 더 궁금한 것이 있으시면 말씀해 주세요.",
  "좋은 말씀이시네요! 오늘도 건강한 하루 보내세요.",
  "잘 알겠습니다. 언제든 편하게 말씀해 주세요.",
  "네! 항상 응원하고 있어요.",
  "그렇군요! 제가 도울 수 있는 일이 있으면 말씀해 주세요.",
];

/** 시간대별 인사말 생성 */
function getTimeGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `${userName} 어르신` : "어르신";

  if (hour < 12) {
    return `좋은 아침이에요, ${name}! 오늘 하루도 건강하게 시작해요.`;
  } else if (hour < 18) {
    return `${name}, 오후에도 힘내세요! 도움이 필요하시면 말씀해 주세요.`;
  } else {
    return `${name}, 편안한 저녁 보내세요. 오늘 하루 수고하셨어요!`;
  }
}

/** localStorage에서 대화 기록 불러오기 */
function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Message[];
      return parsed.slice(-MAX_MESSAGES);
    }
  } catch {
    // localStorage 접근 실패 시 빈 배열
  }
  return [];
}

/** localStorage에 대화 기록 저장 */
function saveMessages(messages: Message[]) {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // 저장 실패 무시
  }
}

/** Web Speech API STT 지원 여부 확인 */
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

type Props = {
  onClose: () => void;
  userName?: string;
};

/**
 * AI 손자 채팅 모달
 * - 전체화면 오버레이 (시니어 최적)
 * - 시간대 기반 인사말
 * - localStorage 대화 기록 저장/복원
 * - 대화 지우기 기능
 * - 채팅 폰트 20px 이상 고정
 * - 음성 인식(STT) 버튼 (입력창 옆, 크게 배치)
 */
export default function AIChatModal({ onClose, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  // STT 지원 여부 확인
  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported());
  }, []);

  // 초기화: localStorage에서 기록 로드 + 인사말
  useEffect(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const greeting: Message = {
        id: "greeting-" + Date.now(),
        role: "assistant",
        content: getTimeGreeting(userName),
        timestamp: new Date().toISOString(),
      };
      setMessages([greeting]);
    }
    setInitialized(true);
  }, [userName]);

  // 메시지 변경 시 localStorage에 저장
  useEffect(() => {
    if (initialized && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 클린업: 컴포넌트 언마운트 시 STT 중단
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* 무시 */ }
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // 자동 응답 (UI 데모)
    setTimeout(() => {
      const reply =
        AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 800);
  }, [inputValue]);

  const handleClearHistory = () => {
    const greeting: Message = {
      id: "greeting-" + Date.now(),
      role: "assistant",
      content: getTimeGreeting(userName),
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  };

  /** 음성 인식 시작/중단 토글 */
  const toggleSTT = useCallback(() => {
    if (isListening) {
      // 중단
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // 시작
    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: { results: { transcript: string; isFinal: boolean }[][] }) => {
      const results = event.results;
      let transcript = "";
      let isFinal = false;

      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
        if (results[i][0].isFinal) isFinal = true;
      }

      setInputValue(transcript);

      if (isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${display}:${m}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chat-title"
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b-2 border-border bg-surface-raised px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover">
            <Bot className="h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div>
            <h1
              id="ai-chat-title"
              className="text-xl font-bold text-text-primary"
            >
              AI 손자
            </h1>
            <p className="text-sm text-text-secondary">언제든 대화하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface active:scale-95"
            aria-label="대화 기록 지우기"
            title="대화 지우기"
          >
            <Trash2 className="h-5 w-5 text-text-muted" strokeWidth={2.2} />
          </button>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-surface active:scale-95"
            aria-label="대화창 닫기"
          >
            <X className="h-6 w-6 text-text-primary" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* 메시지 목록 — 폰트 20px 이상 고정 */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* 아바타 */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-surface" : "bg-primary/10"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-5 w-5 text-text-primary" strokeWidth={2} />
                ) : (
                  <Bot className="h-5 w-5 text-primary" strokeWidth={2} />
                )}
              </div>

              {/* 말풍선 — 최소 20px 폰트 */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border"
                }`}
              >
                <p style={{ fontSize: "20px", lineHeight: 1.6 }}>
                  {msg.content}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    msg.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-text-muted"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 — STT 버튼 크게 배치 */}
      <footer className="border-t-2 border-border bg-surface-raised px-5 py-4">
        <div className="flex gap-3">
          {/* 음성 인식 (STT) 버튼 — 크게 */}
          {sttSupported && (
            <button
              onClick={toggleSTT}
              className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
                isListening
                  ? "border-danger bg-red-50 text-danger animate-pulse"
                  : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
              }`}
              aria-label={isListening ? "음성 인식 중단" : "음성으로 입력하기"}
              title={isListening ? "음성 인식 중..." : "음성 입력"}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" strokeWidth={2.2} />
              ) : (
                <Mic className="h-6 w-6" strokeWidth={2.2} />
              )}
            </button>
          )}

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "말씀해 주세요..." : "메시지를 입력하세요..."}
            className="input-senior flex-1"
            style={{ fontSize: "20px" }}
            aria-label="메시지 입력"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="btn btn-primary shrink-0 min-w-[60px] disabled:opacity-40"
            aria-label="메시지 보내기"
          >
            <Send className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        {isListening && (
          <p className="mt-2 text-center text-base font-medium text-danger animate-pulse">
            🎤 음성 인식 중... 말씀해 주세요
          </p>
        )}
      </footer>
    </div>
  );
}

/**
 * Web Speech API SpeechRecognition 인스턴스 생성
 * 브라우저 호환성 처리 (Chrome: webkitSpeechRecognition)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (W.SpeechRecognition || W.webkitSpeechRecognition) as any;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}
