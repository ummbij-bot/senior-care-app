"use client";

import { useState } from "react";
import { Phone, ArrowRight, Loader2, Heart, Check, ExternalLink } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Step = "phone" | "terms" | "otp" | "success";

type TermsState = {
  termsOfService: boolean;
  privacyPolicy: boolean;
  locationTerms: boolean;
};

const TERMS_LIST = [
  {
    key: "termsOfService" as const,
    label: "이용약관",
    required: true,
    href: "/legal/terms",
  },
  {
    key: "privacyPolicy" as const,
    label: "개인정보 처리방침",
    required: true,
    href: "/legal/privacy",
  },
  {
    key: "locationTerms" as const,
    label: "위치기반 서비스 이용약관",
    required: true,
    href: "/legal/location",
  },
];

/**
 * 시니어 친화적 로그인 페이지
 * - 전화번호 OTP 방식
 * - 필수 약관 동의 체크박스 (가입 전 필수)
 * - 큰 버튼, 명확한 안내
 */
export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermsState>({
    termsOfService: false,
    privacyPolicy: false,
    locationTerms: false,
  });

  const supabase = createSupabaseBrowserClient();

  const allTermsAgreed = TERMS_LIST.every((t) => terms[t.key]);

  const toggleAll = () => {
    const newValue = !allTermsAgreed;
    setTerms({
      termsOfService: newValue,
      privacyPolicy: newValue,
      locationTerms: newValue,
    });
  };

  // 전화번호 형식 변환
  const formatPhoneForAuth = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      return "+82" + cleaned.slice(1);
    }
    return "+82" + cleaned;
  };

  // 약관 동의 후 OTP 발송
  const handleProceedToOtp = () => {
    if (!allTermsAgreed) {
      setError("모든 약관에 동의해주세요");
      return;
    }
    setError(null);
    handleSendOtp();
  };

  // OTP 발송
  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("전화번호를 정확히 입력해주세요");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneForAuth(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        throw error;
      }

      setStep("otp");
    } catch (err) {
      console.error("OTP 발송 오류:", err);
      setError("인증번호 발송에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // OTP 인증
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("인증번호 6자리를 입력해주세요");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneForAuth(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (error) {
        throw error;
      }

      // 약관 동의 일시 기록
      if (data?.user) {
        await supabase
          .from("profiles")
          .update({ terms_agreed_at: new Date().toISOString() })
          .eq("id", data.user.id);
      }

      setStep("success");
      setTimeout(() => {
        // redirect 파라미터가 있으면 해당 페이지로
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/";
        window.location.href = redirectTo;
      }, 1500);
    } catch (err) {
      console.error("OTP 인증 오류:", err);
      setError("인증번호가 틀렸어요. 다시 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="px-5 pt-12 pb-8 text-center sm:px-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-10 w-10 text-primary" strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-text-primary">
          시니어 건강관리
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          전화번호로 간편하게 시작하세요
        </p>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-5 sm:px-8">
        <div className="mx-auto max-w-md">
          {/* 전화번호 입력 단계 */}
          {step === "phone" && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-lg font-semibold text-text-primary"
                >
                  전화번호
                </label>
                <div className="relative mt-2">
                  <Phone className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-text-muted" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="input-senior w-full pl-14"
                    autoComplete="tel"
                  />
                </div>
                <p className="mt-2 text-base text-text-secondary">
                  인증번호가 문자로 발송됩니다
                </p>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-danger bg-red-50 px-4 py-3">
                  <p className="text-base font-medium text-danger">{error}</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (phone.length < 10) {
                    setError("전화번호를 정확히 입력해주세요");
                    return;
                  }
                  setError(null);
                  setStep("terms");
                }}
                disabled={phone.length < 10}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                다음
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* 약관 동의 단계 */}
          {step === "terms" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  약관에 동의해 주세요
                </h2>
                <p className="mt-1 text-base text-text-secondary">
                  서비스 이용을 위해 필수 약관에 동의해 주세요
                </p>
              </div>

              {/* 전체 동의 */}
              <button
                onClick={toggleAll}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                  allTermsAgreed
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-raised"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    allTermsAgreed ? "bg-primary" : "bg-surface border-2 border-border"
                  }`}
                >
                  {allTermsAgreed && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-lg font-bold text-text-primary">
                  전체 동의하기
                </span>
              </button>

              {/* 개별 약관 */}
              <div className="space-y-3">
                {TERMS_LIST.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3"
                  >
                    <button
                      onClick={() =>
                        setTerms((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        terms[item.key]
                          ? "bg-primary"
                          : "bg-surface border-2 border-border"
                      }`}
                      aria-label={`${item.label} 동의`}
                    >
                      {terms[item.key] && (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      )}
                    </button>
                    <span className="flex-1 text-base text-text-primary">
                      <span className="text-danger font-medium">(필수)</span>{" "}
                      {item.label}
                    </span>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface"
                      aria-label={`${item.label} 보기`}
                    >
                      <ExternalLink className="h-4 w-4 text-text-muted" />
                    </a>
                  </div>
                ))}
              </div>

              {error && (
                <div className="rounded-xl border-2 border-danger bg-red-50 px-4 py-3">
                  <p className="text-base font-medium text-danger">{error}</p>
                </div>
              )}

              <button
                onClick={handleProceedToOtp}
                disabled={!allTermsAgreed || loading}
                className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    동의하고 인증번호 받기
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="btn btn-outline w-full"
              >
                이전으로
              </button>
            </div>
          )}

          {/* OTP 입력 단계 */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <p className="text-lg text-text-secondary">
                  <span className="font-semibold text-text-primary">{phone}</span>
                  으로 발송된
                </p>
                <label
                  htmlFor="otp"
                  className="mt-1 block text-lg font-semibold text-text-primary"
                >
                  인증번호 6자리를 입력하세요
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="input-senior mt-3 w-full text-center text-3xl tracking-[0.5em]"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="rounded-xl border-2 border-danger bg-red-50 px-4 py-3">
                  <p className="text-base font-medium text-danger">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  <>
                    확인
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="btn btn-outline w-full"
              >
                전화번호 다시 입력
              </button>
            </div>
          )}

          {/* 성공 */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Heart className="h-10 w-10 text-emerald-600" strokeWidth={2} />
              </div>
              <p className="mt-6 text-2xl font-bold text-text-primary">
                로그인 성공!
              </p>
              <p className="mt-2 text-lg text-text-secondary">
                잠시 후 메인 화면으로 이동합니다
              </p>
              <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </main>

      {/* 하단 안내 */}
      <footer className="px-5 py-6 text-center sm:px-8">
        <p className="text-base text-text-muted">
          문제가 있으시면 보호자에게 도움을 요청하세요
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <a
            href="/legal/privacy"
            className="text-base text-text-muted underline underline-offset-4 hover:text-text-secondary"
          >
            개인정보 처리방침
          </a>
          <span className="text-text-muted">|</span>
          <a
            href="/legal/terms"
            className="text-base text-text-muted underline underline-offset-4 hover:text-text-secondary"
          >
            이용약관
          </a>
        </div>
      </footer>
    </div>
  );
}
