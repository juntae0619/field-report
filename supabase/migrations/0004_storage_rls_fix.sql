-- Storage 'reports' 버킷 정책 강화
-- 기존: 인증된 사용자면 누구든 업로드/삭제 가능
-- 변경: 업로드는 해당 보고서 작성자만, 삭제는 작성자 또는 운영자만

-- 기존 과허용 정책 제거
drop policy if exists "reports_bucket_insert" on storage.objects;
drop policy if exists "reports_bucket_delete" on storage.objects;

-- 업로드: 경로의 첫 세그먼트(reportId)가 본인 보고서인 경우만 허용
create policy "reports_bucket_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'reports' and
    exists (
      select 1 from public.reports r
      where r.id::text = split_part(name, '/', 1)
        and r.author_id = auth.uid()
    )
  );

-- 삭제: 해당 보고서 작성자 또는 운영자만 허용
create policy "reports_bucket_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'reports' and (
      exists (
        select 1 from public.reports r
        where r.id::text = split_part(name, '/', 1)
          and r.author_id = auth.uid()
      ) or
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );
