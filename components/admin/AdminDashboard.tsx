"use client";

import { useState } from "react";
import {
  Users,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserRow = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  membership_tier: string;
  is_banned: boolean;
  created_at: string;
};

type PaymentRow = {
  id: string;
  toss_order_id: string;
  amount: number;
  status: string;
  method: string | null;
  description: string | null;
  created_at: string;
  user_name: string;
};

type Props = {
  currentTab: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  users: UserRow[];
  payments: PaymentRow[];
};

const TABS = [
  { id: "users", label: "유저 관리", icon: Users },
  { id: "payments", label: "결제 관리", icon: CreditCard },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: "성공", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
  pending: { label: "대기", color: "text-amber-600 bg-amber-50", icon: Clock },
  failed: { label: "실패", color: "text-red-600 bg-red-50", icon: XCircle },
  cancelled: { label: "취소", color: "text-gray-600 bg-gray-100", icon: XCircle },
  refunded: { label: "환불", color: "text-blue-600 bg-blue-50", icon: RefreshCw },
};

const TIER_MAP: Record<string, { label: string; color: string }> = {
  free: { label: "무료", color: "text-gray-600 bg-gray-100" },
  premium: { label: "프리미엄", color: "text-primary bg-blue-50" },
};

export default function AdminDashboard({
  currentTab,
  currentPage,
  totalPages,
  totalItems,
  users,
  payments,
}: Props) {
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    setBanLoading(userId);
    try {
      await supabase
        .from("profiles")
        .update({
          is_banned: !currentlyBanned,
          banned_at: !currentlyBanned ? new Date().toISOString() : null,
          ban_reason: !currentlyBanned ? "관리자에 의한 차단" : null,
        })
        .eq("id", userId);

      // 페이지 새로고침으로 데이터 반영
      window.location.reload();
    } catch (err) {
      console.error("차단 처리 실패:", err);
    } finally {
      setBanLoading(null);
    }
  };

  const buildUrl = (tab: string, page: number) => {
    return `/admin?tab=${tab}&page=${page}`;
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="홈으로"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </a>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" strokeWidth={2} />
            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
          </div>
          <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            총 {totalItems}건
          </span>
        </div>
      </header>

      {/* 탭 */}
      <nav className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <a
                key={tab.id}
                href={buildUrl(tab.id, 1)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* 본문 */}
      <main className="px-6 py-6">
        {currentTab === "users" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-600">이름</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">전화번호</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">역할</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">멤버십</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">가입일</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">상태</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        등록된 유저가 없습니다
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const tier = TIER_MAP[u.membership_tier] || TIER_MAP.free;
                      return (
                        <tr key={u.id} className={u.is_banned ? "bg-red-50/50" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                          <td className="px-4 py-3 text-gray-600">{u.phone || "-"}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tier.color}`}>
                              {tier.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                          <td className="px-4 py-3">
                            {u.is_banned ? (
                              <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                차단됨
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                정상
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleToggleBan(u.id, u.is_banned)}
                                disabled={banLoading === u.id}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                  u.is_banned
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                } disabled:opacity-50`}
                              >
                                <Ban className="h-3.5 w-3.5" />
                                {banLoading === u.id
                                  ? "처리 중..."
                                  : u.is_banned
                                    ? "차단 해제"
                                    : "차단"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === "payments" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-600">주문 ID</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">유저</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">금액</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">결제 수단</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">상태</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">내역</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">날짜</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        결제 내역이 없습니다
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {p.toss_order_id.slice(0, 12)}...
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{p.user_name}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {formatAmount(p.amount)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{p.method || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{p.description || "-"}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {currentPage} / {totalPages} 페이지
            </p>
            <div className="flex gap-2">
              <a
                href={currentPage > 1 ? buildUrl(currentTab, currentPage - 1) : "#"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 ${
                  currentPage > 1
                    ? "bg-white text-gray-700 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-300 pointer-events-none"
                }`}
                aria-label="이전 페이지"
              >
                <ChevronLeft className="h-5 w-5" />
              </a>
              <a
                href={currentPage < totalPages ? buildUrl(currentTab, currentPage + 1) : "#"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 ${
                  currentPage < totalPages
                    ? "bg-white text-gray-700 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-300 pointer-events-none"
                }`}
                aria-label="다음 페이지"
              >
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
