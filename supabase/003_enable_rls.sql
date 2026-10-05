-- Phase 4 of multi-tenant migration: turn on tenant-isolation RLS.
-- Supabase 대시보드 → SQL Editor에서 실행하세요.
--
-- 전제조건 (반드시 먼저 배포되어 있어야 함):
--   1) 002_multi_tenant_phase1.sql 실행 완료 (salon_id 백필 완료)
--   2) 앱 코드가 supabase.ts / supabase-auth.ts 클라이언트 통합 커밋 이후로 배포됨
--      (그렇지 않으면 데이터 요청이 익명 권한으로 나가서 이 정책들이 전부 막아버림)
--
-- 문제가 생기면 003_enable_rls_rollback.sql 을 실행해 되돌리세요.

-- 0. salon_id / platform_admin 여부를 안전하게 조회하는 보안 정의자 함수
--    (user_profiles/platform_admins 자체에도 RLS가 걸리므로, 재귀 없이 조회하려면
--     security definer로 테이블 소유자 권한으로 실행해야 함 — Supabase 권장 패턴)
create or replace function public.current_salon_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select salon_id from public.user_profiles where user_id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

-- 1. customers
alter table public.customers enable row level security;
drop policy if exists "공개 읽기 - customers" on public.customers;
drop policy if exists "모든 사용자 쓰기 - customers" on public.customers;
drop policy if exists "tenant isolation - customers" on public.customers;
create policy "tenant isolation - customers" on public.customers
  for all using (salon_id = public.current_salon_id())
  with check (salon_id = public.current_salon_id());

-- 2. services
alter table public.services enable row level security;
drop policy if exists "공개 읽기 - services" on public.services;
drop policy if exists "tenant isolation - services" on public.services;
create policy "tenant isolation - services" on public.services
  for all using (salon_id = public.current_salon_id())
  with check (salon_id = public.current_salon_id());

-- 3. staff
alter table public.staff enable row level security;
drop policy if exists "공개 읽기 - staff" on public.staff;
drop policy if exists "tenant isolation - staff" on public.staff;
create policy "tenant isolation - staff" on public.staff
  for all using (salon_id = public.current_salon_id())
  with check (salon_id = public.current_salon_id());

-- 4. appointments
alter table public.appointments enable row level security;
drop policy if exists "공개 읽기 - appointments" on public.appointments;
drop policy if exists "모든 사용자 쓰기 - appointments" on public.appointments;
drop policy if exists "tenant isolation - appointments" on public.appointments;
create policy "tenant isolation - appointments" on public.appointments
  for all using (salon_id = public.current_salon_id())
  with check (salon_id = public.current_salon_id());

-- 5. appointment_services (salon_id 컬럼이 없어서 appointment_id로 조인해 확인)
alter table public.appointment_services enable row level security;
drop policy if exists "tenant isolation - appointment_services" on public.appointment_services;
create policy "tenant isolation - appointment_services" on public.appointment_services
  for all using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and a.salon_id = public.current_salon_id()
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and a.salon_id = public.current_salon_id()
    )
  );

-- 6. user_profiles (자기 자신은 항상 보이고, 같은 살롱 동료도 조회 가능 / 본인 row만 수정)
alter table public.user_profiles enable row level security;
drop policy if exists "Allow authenticated users to read profiles" on public.user_profiles;
drop policy if exists "Allow users to manage own profile" on public.user_profiles;
drop policy if exists "tenant isolation - user_profiles select" on public.user_profiles;
drop policy if exists "tenant isolation - user_profiles write" on public.user_profiles;
create policy "tenant isolation - user_profiles select" on public.user_profiles
  for select using (
    user_id = auth.uid() or salon_id = public.current_salon_id()
  );
create policy "tenant isolation - user_profiles write" on public.user_profiles
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 7. salons (자기 소속 salon 행만 조회 가능, 쓰기는 서비스 롤에서만 — 결제/운영자 콘솔 용)
alter table public.salons enable row level security;
drop policy if exists "read own salon" on public.salons;
create policy "read own salon" on public.salons
  for select using (id = public.current_salon_id() or public.is_platform_admin());

-- 8. platform_admins / payments: RLS만 켜고 정책은 만들지 않음
--    (service role만 접근 가능 — platform_admins는 운영자 콘솔 서버 라우트 전용,
--     payments는 현재 앱에서 아예 쓰지 않는 레거시 테이블)
alter table public.platform_admins enable row level security;
alter table public.payments enable row level security;
