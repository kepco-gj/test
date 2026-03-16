-- ============================================================
-- 서류 업로드 오류 "new row violates row-level security policy" 해결용
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 붙여넣고 Run 실행
-- ============================================================

alter table public.reservations enable row level security;

drop policy if exists "Allow anon insert" on public.reservations;
create policy "Allow anon insert"
on public.reservations for insert to anon
with check (true);

drop policy if exists "Allow anon select" on public.reservations;
create policy "Allow anon select"
on public.reservations for select to anon
using (true);

-- 상태 변경(승인/반려)용 UPDATE 허용 (관리자 페이지에서만 사용)
drop policy if exists "Allow anon update status" on public.reservations;
create policy "Allow anon update status"
on public.reservations for update to anon
using (true)
with check (true);

-- 2) Storage (reservation-files): anon이 파일 업로드 가능
drop policy if exists "Allow anon upload to reservation-files" on storage.objects;
create policy "Allow anon upload to reservation-files"
on storage.objects for insert to anon
with check (bucket_id = 'reservation-files');

drop policy if exists "Allow public read reservation-files" on storage.objects;
create policy "Allow public read reservation-files"
on storage.objects for select to anon
using (bucket_id = 'reservation-files');
