-- 발표 일정은 반·조 구분 없이 전체 참여 일정으로 관리한다.

alter table public.schedules
  alter column cohort drop not null;

-- 기존 발표 일정도 전체 참여 기준으로 정리한다.
update public.schedules
set cohort = null,
    group_id = null
where type = 'presentation';

alter table public.schedules
  drop constraint if exists schedules_audience_check;

alter table public.schedules
  add constraint schedules_audience_check check (
    (type = 'presentation' and cohort is null and group_id is null)
    or
    (type = 'visit' and cohort in ('weekday', 'weekend'))
  );

comment on column public.schedules.cohort is
  '임장 일정은 weekday/weekend, 전체 참여 발표 일정은 null';
