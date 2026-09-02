-- 임장 도메인 확장 및 권한/무결성 강화
-- Supabase SQL Editor 또는 `supabase db push`로 적용하세요.

-- =========================================================
-- 1. 임장 희망 물건 실무 필드
-- =========================================================
alter table public.properties
  add column if not exists status text not null default 'candidate',
  add column if not exists deal_type text,
  add column if not exists asking_price_manwon bigint,
  add column if not exists monthly_rent_manwon bigint,
  add column if not exists maintenance_fee_manwon numeric(10, 2),
  add column if not exists exclusive_area_m2 numeric(10, 2),
  add column if not exists building_year int,
  add column if not exists households int,
  add column if not exists source_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.properties
  drop constraint if exists properties_status_check,
  add constraint properties_status_check
    check (status in ('candidate', 'scheduled', 'visited', 'hold', 'archived')),
  drop constraint if exists properties_deal_type_check,
  add constraint properties_deal_type_check
    check (deal_type is null or deal_type in ('sale', 'jeonse', 'monthly_rent', 'auction', 'public_auction', 'other')),
  drop constraint if exists properties_asking_price_check,
  add constraint properties_asking_price_check
    check (asking_price_manwon is null or asking_price_manwon >= 0),
  drop constraint if exists properties_monthly_rent_check,
  add constraint properties_monthly_rent_check
    check (monthly_rent_manwon is null or monthly_rent_manwon >= 0),
  drop constraint if exists properties_maintenance_fee_check,
  add constraint properties_maintenance_fee_check
    check (maintenance_fee_manwon is null or maintenance_fee_manwon >= 0),
  drop constraint if exists properties_exclusive_area_check,
  add constraint properties_exclusive_area_check
    check (exclusive_area_m2 is null or exclusive_area_m2 > 0),
  drop constraint if exists properties_building_year_check,
  add constraint properties_building_year_check
    check (building_year is null or building_year between 1800 and 2100),
  drop constraint if exists properties_households_check,
  add constraint properties_households_check
    check (households is null or households >= 0);

-- =========================================================
-- 2. 일정의 시간·집결지 및 변경 이력
-- =========================================================
alter table public.schedules
  add column if not exists visit_time time,
  add column if not exists meeting_place text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function private.set_updated_at();

drop trigger if exists trg_schedules_updated_at on public.schedules;
create trigger trg_schedules_updated_at
  before update on public.schedules
  for each row execute function private.set_updated_at();

-- =========================================================
-- 3. 피드백 무결성과 조회 인덱스
-- =========================================================
delete from public.feedbacks
where report_id is null and property_id is null;

alter table public.feedbacks
  drop constraint if exists feedbacks_exactly_one_target_check,
  add constraint feedbacks_exactly_one_target_check
    check ((report_id is not null)::int + (property_id is not null)::int = 1);

create index if not exists idx_reports_schedule on public.reports (schedule_id);
create index if not exists idx_properties_created_by on public.properties (created_by);
create index if not exists idx_properties_status on public.properties (status);
create index if not exists idx_posts_author on public.posts (author_id);
create index if not exists idx_comments_author on public.comments (author_id);

-- =========================================================
-- 4. 보고서 Storage 서버측 제한 및 UPDATE 권한 보완
-- =========================================================
update storage.buckets
set file_size_limit = 20971520
where id = 'reports';

drop policy if exists "reports_bucket_insert" on storage.objects;
create policy "reports_bucket_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'reports' and
    lower(storage.extension(name)) in (
      'pdf', 'hwp', 'hwpx', 'ppt', 'pptx', 'doc', 'docx',
      'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'zip'
    ) and
    exists (
      select 1 from public.reports r
      where r.id::text = split_part(name, '/', 1)
        and r.author_id = auth.uid()
    )
  );

drop policy if exists "reports_bucket_update" on storage.objects;
create policy "reports_bucket_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reports' and (
      exists (
        select 1 from public.reports r
        where r.id::text = split_part(name, '/', 1)
          and r.author_id = auth.uid()
      ) or private.is_admin()
    )
  )
  with check (
    bucket_id = 'reports' and
    lower(storage.extension(name)) in (
      'pdf', 'hwp', 'hwpx', 'ppt', 'pptx', 'doc', 'docx',
      'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'zip'
    ) and (
      exists (
        select 1 from public.reports r
        where r.id::text = split_part(name, '/', 1)
          and r.author_id = auth.uid()
      ) or private.is_admin()
    )
  );
