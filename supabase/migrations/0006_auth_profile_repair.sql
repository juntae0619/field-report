-- 인증/프로필 연동 복구
-- Supabase SQL Editor 또는 `supabase db push`로 적용하세요.

-- RLS 정책에서 private.is_admin()을 호출할 수 있도록 최소 권한을 부여한다.
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- 신규 Auth 사용자의 프로필 생성 트리거를 안전하게 다시 정의한다.
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
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case
          when public.profiles.name = '' then excluded.name
          else public.profiles.name
        end;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
grant execute on function private.handle_new_user() to supabase_auth_admin, service_role;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 과거 트리거 오류 등으로 누락된 프로필을 복구한다.
insert into public.profiles (id, name, email)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(users.email, ''), '@', 1),
    ''
  ),
  users.email
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

-- 트리거가 일시적으로 실패해도 로그인한 사용자가 자신의 프로필을 복구할 수 있다.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
