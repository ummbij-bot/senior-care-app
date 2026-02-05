-- ============================================
-- SMS 발송 로그 테이블 (Rate Limiting 용)
-- ============================================

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
    check (status in ('sent', 'failed', 'blocked')),
  message_preview text,               -- 메시지 앞 50자 (디버그용)
  created_at timestamptz not null default now()
);

-- 전화번호 + 발송시각 인덱스 (Rate Limit 조회 최적화)
create index if not exists idx_sms_logs_phone_sent
  on public.sms_logs(phone_number, sent_at desc);

-- RLS
alter table public.sms_logs enable row level security;

-- 서버 사이드에서만 삽입/조회 (service role key 사용 시 bypass)
-- 일반 anon key로는 접근 불가하게 설정
create policy "Deny all for sms_logs anon"
  on public.sms_logs
  for all
  using (false)
  with check (false);

-- 오래된 로그 자동 정리 (30일 이상 된 레코드 삭제용 - cron 또는 Edge Function 활용)
-- 운영 시 pg_cron 확장으로 자동화 권장:
-- SELECT cron.schedule('cleanup-sms-logs', '0 3 * * *',
--   $$DELETE FROM public.sms_logs WHERE sent_at < NOW() - INTERVAL '30 days'$$
-- );
