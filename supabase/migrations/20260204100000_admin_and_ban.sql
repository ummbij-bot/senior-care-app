-- ============================================
-- 관리자 역할 + 유저 차단 기능
-- ============================================

-- 1. profiles role에 'admin' 추가
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('senior', 'guardian', 'admin'));

-- 2. 차단 상태 컬럼 추가
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text;

-- 3. 약관 동의 일시 컬럼 추가
alter table public.profiles
  add column if not exists terms_agreed_at timestamptz;
