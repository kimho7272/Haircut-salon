-- Phase 1 of multi-tenant migration (salon.ryansuite.com)
-- Supabase 대시보드 → SQL Editor에서 실행하세요.
-- 이 스크립트는 (1) salons/platform_admins 테이블 생성, (2) 기존 테이블에
-- salon_id 컬럼 추가, (3) 기존 "Illy Hair" 데이터를 첫 번째 tenant로 백필합니다.
-- RLS 정책은 여기서 켜지 않습니다 (앱 코드가 salon_id를 채우도록 먼저 배포한 뒤,
-- 별도 스크립트로 RLS를 켭니다 — 지금 켜면 앱이 당장 깨집니다).

-- 1. salons (tenant) 테이블
create table if not exists public.salons (
  id uuid default uuid_generate_v4() primary key,
  name varchar(100) not null,
  slug varchar(100) unique not null,
  plan varchar(20) not null default 'free' check (plan in ('free', 'paid')),
  status varchar(20) not null default 'active' check (status in ('trial', 'active', 'suspended')),
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger update_salons_updated_at before update on public.salons
  for each row execute procedure public.update_updated_at_column();

-- 2. platform_admins (RyanSuite 운영자 — 특정 salon에 속하지 않음)
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 운영자 계정은 비워둡니다. RyanSuite 운영자로 쓸 Supabase Auth 계정을 만든 뒤
-- 아래처럼 직접 추가하세요(해당 user_id는 Auth 대시보드에서 확인):
--   insert into public.platform_admins (user_id) values ('<운영자-user-id>');

-- 3. 기존 테이블에 salon_id 추가 (일단 nullable — 백필 후 app 배포까지는 NOT NULL 걸지 않음)
alter table public.customers   add column if not exists salon_id uuid references public.salons(id);
alter table public.services    add column if not exists salon_id uuid references public.salons(id);
alter table public.staff       add column if not exists salon_id uuid references public.salons(id);
alter table public.appointments add column if not exists salon_id uuid references public.salons(id);
alter table public.user_profiles add column if not exists salon_id uuid references public.salons(id);

create index if not exists idx_customers_salon on public.customers(salon_id);
create index if not exists idx_services_salon on public.services(salon_id);
create index if not exists idx_staff_salon on public.staff(salon_id);
create index if not exists idx_appointments_salon on public.appointments(salon_id);
create index if not exists idx_user_profiles_salon on public.user_profiles(salon_id);

-- 4. 기존 "Illy Hair" 데이터를 tenant #1 로 백필
do $$
declare
  v_salon_id uuid;
  v_owner_user_id uuid;
begin
  -- 이미 백필된 적이 있으면 건너뜀 (재실행 안전)
  if exists (select 1 from public.salons where slug = 'illy-hair') then
    raise notice 'illy-hair salon already exists, skipping backfill';
    return;
  end if;

  select user_id into v_owner_user_id
  from public.user_profiles
  where role = 'admin'
  order by created_at asc
  limit 1;

  insert into public.salons (name, slug, plan, status, owner_user_id)
  values ('Illy Hair', 'illy-hair', 'paid', 'active', v_owner_user_id)
  returning id into v_salon_id;

  update public.customers    set salon_id = v_salon_id where salon_id is null;
  update public.services     set salon_id = v_salon_id where salon_id is null;
  update public.staff        set salon_id = v_salon_id where salon_id is null;
  update public.appointments set salon_id = v_salon_id where salon_id is null;
  update public.user_profiles set salon_id = v_salon_id where salon_id is null;

  raise notice 'Backfilled Illy Hair as salon_id = %', v_salon_id;
end $$;
