-- 임장 스터디 관리 프로그램 초기 스키마
-- Supabase SQL Editor 또는 `supabase db push` 로 적용하세요.

-- =========================================================
-- 0. 확장 / private 스키마 (보안 정의자 함수 보관)
-- =========================================================
create extension if not exists "pgcrypto";

create schema if not exists private;

-- =========================================================
-- 1. 테이블
-- =========================================================

-- 프로필 (auth.users 와 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  role text not null default 'member' check (role in ('admin', 'member')),
  cohort text check (cohort in ('weekday', 'weekend')),
  created_at timestamptz not null default now()
);

-- 조
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cohort text not null check (cohort in ('weekday', 'weekend')),
  leader_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 조원 매핑
create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (group_id, profile_id)
);

-- 임장 물건
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  property_type text,
  region text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 임장 일정/계획
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  visit_date date not null,
  cohort text not null check (cohort in ('weekday', 'weekend')),
  group_id uuid references public.groups (id) on delete set null,
  region text,
  plan text,
  status text not null default 'planned' check (status in ('planned', 'done', 'canceled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 임장 보고서
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  schedule_id uuid references public.schedules (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  summary text,
  location_review text,
  price_review text,
  pros text,
  cons text,
  conclusion text,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 보고서 첨부 파일 (Storage 'reports' 버킷)
create table if not exists public.report_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- 물건/보고서 피드백
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete cascade,
  property_id uuid references public.properties (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating int check (rating between 1 and 5),
  content text not null,
  created_at timestamptz not null default now()
);

-- 게시판
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  category text,
  author_id uuid not null references public.profiles (id) on delete cascade,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 개인 메모
create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 조회 성능을 위한 인덱스
create index if not exists idx_schedules_visit_date on public.schedules (visit_date);
create index if not exists idx_reports_author on public.reports (author_id);
create index if not exists idx_reports_property on public.reports (property_id);
create index if not exists idx_feedbacks_report on public.feedbacks (report_id);
create index if not exists idx_feedbacks_property on public.feedbacks (property_id);
create index if not exists idx_comments_post on public.comments (post_id);
create index if not exists idx_memos_owner on public.memos (owner_id);

-- =========================================================
-- 2. 헬퍼 함수 (private 스키마, security definer 로 RLS 재귀 방지)
-- =========================================================
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 신규 가입 시 프로필 자동 생성
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- updated_at 자동 갱신
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function private.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

drop trigger if exists trg_memos_updated_at on public.memos;
create trigger trg_memos_updated_at
  before update on public.memos
  for each row execute function private.set_updated_at();

-- =========================================================
-- 3. RLS 활성화
-- =========================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.properties enable row level security;
alter table public.schedules enable row level security;
alter table public.reports enable row level security;
alter table public.report_files enable row level security;
alter table public.feedbacks enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.memos enable row level security;

-- =========================================================
-- 4. 정책
--    기본 원칙: 로그인한 스터디원은 모든 콘텐츠 열람 가능,
--    작성/수정/삭제는 작성자 또는 운영자(admin) 만 가능.
-- =========================================================

-- profiles
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (private.is_admin());

-- groups (관리: admin)
create policy "groups_select_all" on public.groups
  for select to authenticated using (true);
create policy "groups_write_admin" on public.groups
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- group_members (관리: admin)
create policy "group_members_select_all" on public.group_members
  for select to authenticated using (true);
create policy "group_members_write_admin" on public.group_members
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- properties (등록: 모든 조원 / 수정·삭제: 작성자 또는 admin)
create policy "properties_select_all" on public.properties
  for select to authenticated using (true);
create policy "properties_insert_auth" on public.properties
  for insert to authenticated with check (created_by = auth.uid() or private.is_admin());
create policy "properties_update_owner_admin" on public.properties
  for update to authenticated
  using (created_by = auth.uid() or private.is_admin())
  with check (created_by = auth.uid() or private.is_admin());
create policy "properties_delete_owner_admin" on public.properties
  for delete to authenticated using (created_by = auth.uid() or private.is_admin());

-- schedules (관리: admin)
create policy "schedules_select_all" on public.schedules
  for select to authenticated using (true);
create policy "schedules_write_admin" on public.schedules
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- reports (작성: 모든 조원 / 수정·삭제: 작성자 또는 admin)
create policy "reports_select_all" on public.reports
  for select to authenticated using (true);
create policy "reports_insert_self" on public.reports
  for insert to authenticated with check (author_id = auth.uid());
create policy "reports_update_owner_admin" on public.reports
  for update to authenticated
  using (author_id = auth.uid() or private.is_admin())
  with check (author_id = auth.uid() or private.is_admin());
create policy "reports_delete_owner_admin" on public.reports
  for delete to authenticated using (author_id = auth.uid() or private.is_admin());

-- report_files (열람: 모두 / 추가·삭제: 해당 보고서 작성자 또는 admin)
create policy "report_files_select_all" on public.report_files
  for select to authenticated using (true);
create policy "report_files_insert_owner_admin" on public.report_files
  for insert to authenticated with check (
    private.is_admin() or exists (
      select 1 from public.reports r
      where r.id = report_id and r.author_id = auth.uid()
    )
  );
create policy "report_files_delete_owner_admin" on public.report_files
  for delete to authenticated using (
    private.is_admin() or exists (
      select 1 from public.reports r
      where r.id = report_id and r.author_id = auth.uid()
    )
  );

-- feedbacks (작성: 모든 조원 / 수정·삭제: 작성자 또는 admin)
create policy "feedbacks_select_all" on public.feedbacks
  for select to authenticated using (true);
create policy "feedbacks_insert_self" on public.feedbacks
  for insert to authenticated with check (author_id = auth.uid());
create policy "feedbacks_update_owner_admin" on public.feedbacks
  for update to authenticated
  using (author_id = auth.uid() or private.is_admin())
  with check (author_id = auth.uid() or private.is_admin());
create policy "feedbacks_delete_owner_admin" on public.feedbacks
  for delete to authenticated using (author_id = auth.uid() or private.is_admin());

-- posts (게시판)
create policy "posts_select_all" on public.posts
  for select to authenticated using (true);
create policy "posts_insert_self" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy "posts_update_owner_admin" on public.posts
  for update to authenticated
  using (author_id = auth.uid() or private.is_admin())
  with check (author_id = auth.uid() or private.is_admin());
create policy "posts_delete_owner_admin" on public.posts
  for delete to authenticated using (author_id = auth.uid() or private.is_admin());

-- comments
create policy "comments_select_all" on public.comments
  for select to authenticated using (true);
create policy "comments_insert_self" on public.comments
  for insert to authenticated with check (author_id = auth.uid());
create policy "comments_update_owner_admin" on public.comments
  for update to authenticated
  using (author_id = auth.uid() or private.is_admin())
  with check (author_id = auth.uid() or private.is_admin());
create policy "comments_delete_owner_admin" on public.comments
  for delete to authenticated using (author_id = auth.uid() or private.is_admin());

-- memos (본인 전용)
create policy "memos_select_own" on public.memos
  for select to authenticated using (owner_id = auth.uid());
create policy "memos_insert_own" on public.memos
  for insert to authenticated with check (owner_id = auth.uid());
create policy "memos_update_own" on public.memos
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "memos_delete_own" on public.memos
  for delete to authenticated using (owner_id = auth.uid());

-- =========================================================
-- 5. Storage 버킷 ('reports') + 정책
-- =========================================================
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- 로그인한 조원은 reports 버킷의 파일을 열람/업로드/수정/삭제 가능
-- (upsert 동작을 위해 select + insert + update 모두 필요)
create policy "reports_bucket_select" on storage.objects
  for select to authenticated using (bucket_id = 'reports');
create policy "reports_bucket_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'reports');
create policy "reports_bucket_update" on storage.objects
  for update to authenticated using (bucket_id = 'reports');
create policy "reports_bucket_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'reports');
