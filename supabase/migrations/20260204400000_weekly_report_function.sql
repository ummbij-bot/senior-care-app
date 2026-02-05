-- ============================================
-- 주간 복약 리포트 함수
-- 지난 7일간의 복약 성공률 계산
-- ============================================

create or replace function public.get_weekly_medication_report(p_user_id uuid)
returns table (
  report_date date,
  total_count bigint,
  taken_count bigint,
  success_rate numeric
) as $$
begin
  return query
  select
    ml.scheduled_date as report_date,
    count(*)::bigint as total_count,
    count(*) filter (where ml.status = 'taken')::bigint as taken_count,
    case
      when count(*) = 0 then 0
      else round(
        (count(*) filter (where ml.status = 'taken')::numeric / count(*)::numeric) * 100,
        1
      )
    end as success_rate
  from public.medication_logs ml
  where ml.user_id = p_user_id
    and ml.scheduled_date >= current_date - interval '6 days'
    and ml.scheduled_date <= current_date
  group by ml.scheduled_date
  order by ml.scheduled_date asc;
end;
$$ language plpgsql security definer;
