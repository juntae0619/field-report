-- 임장보고서: 임장일자/지역 컬럼 추가
alter table public.reports
  add column if not exists visit_date date,
  add column if not exists region text;

create index if not exists idx_reports_visit_date on public.reports (visit_date);
