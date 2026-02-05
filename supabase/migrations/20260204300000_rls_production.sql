-- ============================================
-- Production RLS 정책: 개발용 "Allow all" → 실제 인증 기반 정책
-- ============================================

-- ─────────────────────────────────────────
-- 1. 기존 "Allow all" 정책 삭제
-- ─────────────────────────────────────────
drop policy if exists "Allow all for profiles" on public.profiles;
drop policy if exists "Allow all for medications" on public.medications;
drop policy if exists "Allow all for schedules" on public.medication_schedules;
drop policy if exists "Allow all for logs" on public.medication_logs;

-- ─────────────────────────────────────────
-- 2. profiles 테이블 정책
-- ─────────────────────────────────────────

-- 본인 프로필 조회
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

-- 보호자가 연결된 시니어 프로필 조회
create policy "profiles_select_linked"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles guardian
      where guardian.id = auth.uid()
        and guardian.role = 'guardian'
        and guardian.linked_to = profiles.id
    )
  );

-- 관리자 전체 프로필 조회
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid()
        and admin.role = 'admin'
    )
  );

-- 본인 프로필 수정
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- 관리자 프로필 수정 (차단 등)
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid()
        and admin.role = 'admin'
    )
  );

-- 프로필 신규 생성 (가입 시)
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- ─────────────────────────────────────────
-- 3. medications 테이블 정책
-- ─────────────────────────────────────────

-- 본인 약 조회
create policy "medications_select_own"
  on public.medications for select
  using (user_id = auth.uid());

-- 보호자가 연결된 시니어의 약 조회
create policy "medications_select_guardian"
  on public.medications for select
  using (
    exists (
      select 1 from public.profiles guardian
      where guardian.id = auth.uid()
        and guardian.role = 'guardian'
        and guardian.linked_to = medications.user_id
    )
  );

-- 본인 약 등록
create policy "medications_insert_own"
  on public.medications for insert
  with check (user_id = auth.uid());

-- 본인 약 수정
create policy "medications_update_own"
  on public.medications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 본인 약 삭제
create policy "medications_delete_own"
  on public.medications for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 4. medication_schedules 테이블 정책
-- ─────────────────────────────────────────

-- 본인 스케줄 조회
create policy "schedules_select_own"
  on public.medication_schedules for select
  using (user_id = auth.uid());

-- 보호자가 연결된 시니어의 스케줄 조회
create policy "schedules_select_guardian"
  on public.medication_schedules for select
  using (
    exists (
      select 1 from public.profiles guardian
      where guardian.id = auth.uid()
        and guardian.role = 'guardian'
        and guardian.linked_to = medication_schedules.user_id
    )
  );

-- 본인 스케줄 등록/수정/삭제
create policy "schedules_insert_own"
  on public.medication_schedules for insert
  with check (user_id = auth.uid());

create policy "schedules_update_own"
  on public.medication_schedules for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "schedules_delete_own"
  on public.medication_schedules for delete
  using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 5. medication_logs 테이블 정책
-- ─────────────────────────────────────────

-- 본인 복약 로그 조회
create policy "logs_select_own"
  on public.medication_logs for select
  using (user_id = auth.uid());

-- 보호자가 연결된 시니어의 로그 조회
create policy "logs_select_guardian"
  on public.medication_logs for select
  using (
    exists (
      select 1 from public.profiles guardian
      where guardian.id = auth.uid()
        and guardian.role = 'guardian'
        and guardian.linked_to = medication_logs.user_id
    )
  );

-- 본인 로그 등록 (복약 기록)
create policy "logs_insert_own"
  on public.medication_logs for insert
  with check (user_id = auth.uid());

-- 본인 로그 수정 (상태 변경: pending → taken/skipped)
create policy "logs_update_own"
  on public.medication_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 6. medication_logs 중복 방지용 upsert 함수
-- Server Action에서 호출하여 safe upsert 수행
-- ─────────────────────────────────────────
create or replace function public.upsert_medication_log(
  p_schedule_id uuid,
  p_user_id uuid,
  p_medication_id uuid,
  p_scheduled_date date,
  p_scheduled_time time,
  p_status text default 'pending'
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  -- UNIQUE(schedule_id, scheduled_date) 제약 조건으로 중복 방지
  insert into public.medication_logs (
    schedule_id, user_id, medication_id,
    scheduled_date, scheduled_time, status
  ) values (
    p_schedule_id, p_user_id, p_medication_id,
    p_scheduled_date, p_scheduled_time, p_status
  )
  on conflict (schedule_id, scheduled_date)
  do update set updated_at = now()
  returning id into v_log_id;

  return v_log_id;
end;
$$ language plpgsql security definer;
