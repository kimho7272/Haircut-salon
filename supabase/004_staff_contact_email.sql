-- Phase: per-salon staff login (salon.ryansuite.com/<slug>)
-- Supabase 대시보드 → SQL Editor에서 실행하세요.
--
-- 직원은 여러 미용실에 같은(실제) 이메일로 등록될 수 있어야 하므로, Supabase
-- auth.users의 전역 이메일 유일성 제약과 분리하기 위해 "실제 로그인 이메일"을
-- user_profiles.contact_email에 미용실(salon_id) 단위로 따로 저장한다.
-- (auth.users.email 자체는 앞으로 새로 초대되는 직원에 대해서는 내부용
-- 합성 이메일이 되고, 사람이 실제로 입력하는 이메일이 contact_email이다.
-- 관리자는 지금처럼 auth 이메일 = contact_email 그대로.)

alter table public.user_profiles add column if not exists contact_email varchar(255);

-- 기존 계정(관리자/기존 직원)은 지금의 실제 auth 이메일을 그대로 contact_email로 백필
update public.user_profiles up
set contact_email = au.email
from auth.users au
where up.user_id = au.id
  and up.contact_email is null;

alter table public.user_profiles alter column contact_email set not null;

-- 같은 미용실 안에서는 contact_email 중복 금지, 미용실이 다르면 중복 허용
alter table public.user_profiles
  add constraint unique_salon_contact_email unique (salon_id, contact_email);

create index if not exists idx_user_profiles_contact_email on public.user_profiles(contact_email);
