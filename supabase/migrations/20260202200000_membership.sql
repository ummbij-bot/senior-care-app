-- ============================================
-- 멤버십 & 결제 스키마
-- ============================================

-- 1. profiles 테이블에 멤버십 필드 추가
alter table public.profiles
  add column if not exists membership_tier text not null default 'free'
    check (membership_tier in ('free', 'premium')),
  add column if not exists membership_expires_at timestamptz,
  add column if not exists toss_customer_key text;

create index if not exists idx_profiles_membership on public.profiles(membership_tier);

-- 2. 구독(멤버십) 이력 테이블
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null check (tier in ('premium')),
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'expired', 'pending')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cancelled_at timestamptz,
  toss_billing_key text,
  toss_subscription_id text,
  amount int not null,             -- 결제 금액 (원)
  interval text not null default 'monthly'
    check (interval in ('monthly', 'yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

-- 3. 결제 내역 테이블
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id),
  toss_payment_key text,           -- 토스 결제 키
  toss_order_id text not null,     -- 주문 ID
  amount int not null,             -- 금액
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'cancelled', 'refunded')),
  method text,                     -- 카드, 계좌이체 등
  description text,
  paid_at timestamptz,
  failed_reason text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payment_history(user_id);
create index if not exists idx_payments_order on public.payment_history(toss_order_id);

-- 4. 기능 제한 테이블 (멤버십별 사용 가능 기능 정의)
create table if not exists public.feature_gates (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  feature_name text not null,
  description text,
  free_limit int,                  -- null = 비활성, 0 = 무제한은 아님
  premium_limit int,               -- null = 무제한
  created_at timestamptz not null default now()
);

-- RLS
alter table public.subscriptions enable row level security;
alter table public.payment_history enable row level security;
alter table public.feature_gates enable row level security;

create policy "Allow all for subscriptions" on public.subscriptions for all using (true) with check (true);
create policy "Allow all for payments" on public.payment_history for all using (true) with check (true);
create policy "Allow all for features" on public.feature_gates for all using (true) with check (true);

-- updated_at 트리거
create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_payments
  before update on public.payment_history
  for each row execute function public.handle_updated_at();

-- 5. 기능 제한 초기 데이터
insert into public.feature_gates (feature_key, feature_name, description, free_limit, premium_limit) values
('medication_alerts',   '복약 알림',           '등록 가능한 복약 알림 수',          1,    null),
('trot_songs',          '트로트 곡 수',         '재생 가능한 트로트 곡 수',          3,    null),
('english_lessons',     '영어 학습',           '일일 영어 학습 접근',              1,    null),
('realtime_location',   '실시간 위치 공유',     '자녀와 실시간 위치 공유',          0,    null),
('emergency_center',    '전담 관제센터',        '긴급 상황 시 전담 관제센터 연결',    0,    null),
('guardian_dashboard',  '보호자 대시보드',      '보호자 실시간 모니터링',            0,    null),
('unlimited_history',   '복약 이력 조회',       '전체 복약 이력 무제한 조회',        7,    null);
