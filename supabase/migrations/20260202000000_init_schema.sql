-- ============================================
-- 시니어 건강관리 앱 - 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- ============================================
-- 1. profiles: 사용자 프로필 (시니어 + 보호자)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('senior', 'guardian')),
  phone text,
  linked_to uuid references public.profiles(id), -- 보호자 ↔ 시니어 연결
  push_subscription jsonb, -- Web Push 구독 JSON
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_linked_to on public.profiles(linked_to);

-- ============================================
-- 2. medications: 약 정보
-- ============================================
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dosage text not null, -- "1정", "2캡슐"
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_medications_user on public.medications(user_id);

-- ============================================
-- 3. medication_schedules: 복약 스케줄
-- ============================================
create table if not exists public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_time time not null, -- 08:00, 13:00, 20:00
  label text not null, -- "아침", "점심", "저녁"
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_schedules_user on public.medication_schedules(user_id);
create index if not exists idx_schedules_time on public.medication_schedules(scheduled_time);

-- ============================================
-- 4. medication_logs: 복약 기록 (핵심 테이블)
-- ============================================
create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.medication_schedules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  status text not null default 'pending' check (status in ('taken', 'missed', 'skipped', 'pending')),
  scheduled_date date not null, -- 2026-02-02
  scheduled_time time not null, -- 08:00
  taken_at timestamptz, -- 실제 복용 시각
  notified_guardian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 같은 날 같은 스케줄에 중복 기록 방지
  unique(schedule_id, scheduled_date)
);

create index if not exists idx_logs_user_date on public.medication_logs(user_id, scheduled_date);
create index if not exists idx_logs_status on public.medication_logs(status);
create index if not exists idx_logs_pending on public.medication_logs(status, scheduled_date)
  where status = 'pending';

-- ============================================
-- 5. Realtime 활성화
-- medication_logs 테이블의 변경을 실시간 감지
-- ============================================
alter publication supabase_realtime add table public.medication_logs;

-- ============================================
-- 6. RLS (Row Level Security) 정책
-- ============================================
alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.medication_logs enable row level security;

-- 개발 단계: 모든 접근 허용 (프로덕션에서는 auth 기반으로 변경)
create policy "Allow all for profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all for medications" on public.medications for all using (true) with check (true);
create policy "Allow all for schedules" on public.medication_schedules for all using (true) with check (true);
create policy "Allow all for logs" on public.medication_logs for all using (true) with check (true);

-- ============================================
-- 7. updated_at 자동 갱신 트리거
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_logs
  before update on public.medication_logs
  for each row execute function public.handle_updated_at();

-- ============================================
-- 8. 테스트 데이터 (시니어 1명 + 보호자 1명)
-- ============================================
do $$
declare
  senior_id uuid := gen_random_uuid();
  guardian_id uuid := gen_random_uuid();
  med_bp_id uuid := gen_random_uuid();
  med_sugar_id uuid := gen_random_uuid();
  med_vitamin_id uuid := gen_random_uuid();
begin
  -- 시니어 프로필
  insert into public.profiles (id, name, role, phone)
  values (senior_id, '홍길동', 'senior', '010-1234-5678');

  -- 보호자 프로필 (시니어에 연결)
  insert into public.profiles (id, name, role, phone, linked_to)
  values (guardian_id, '홍길순', 'guardian', '010-9876-5432', senior_id);

  -- 약 등록
  insert into public.medications (id, user_id, name, dosage, description) values
  (med_bp_id, senior_id, '혈압약', '1정', '아침 식후 30분'),
  (med_sugar_id, senior_id, '당뇨약', '1정', '아침, 저녁 식전'),
  (med_vitamin_id, senior_id, '비타민D', '2정', '아침 식후');

  -- 스케줄 등록
  insert into public.medication_schedules (medication_id, user_id, scheduled_time, label) values
  (med_bp_id, senior_id, '08:00', '아침'),
  (med_sugar_id, senior_id, '08:00', '아침'),
  (med_sugar_id, senior_id, '19:00', '저녁'),
  (med_vitamin_id, senior_id, '08:00', '아침');

  -- 오늘 날짜의 복약 로그 자동 생성 (pending 상태)
  insert into public.medication_logs (schedule_id, user_id, medication_id, scheduled_date, scheduled_time, status)
  select s.id, s.user_id, s.medication_id, current_date, s.scheduled_time, 'pending'
  from public.medication_schedules s
  where s.user_id = senior_id and s.is_active = true;
end $$;
