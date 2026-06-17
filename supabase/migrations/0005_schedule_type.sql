-- 임장 일정 유형 컬럼 추가 (visit: 임장 일정, presentation: 발표 일정)
alter table public.schedules
  add column if not exists type text not null default 'visit'
  check (type in ('visit', 'presentation'));
