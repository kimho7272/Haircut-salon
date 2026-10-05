-- 003_enable_rls.sql 롤백용. 문제가 생겼을 때만 실행하세요.
-- RLS를 다시 끄는 것이지, 마이그레이션(002) 자체를 되돌리는 건 아닙니다.

alter table public.customers disable row level security;
alter table public.services disable row level security;
alter table public.staff disable row level security;
alter table public.appointments disable row level security;
alter table public.appointment_services disable row level security;
alter table public.user_profiles disable row level security;
alter table public.salons disable row level security;
alter table public.platform_admins disable row level security;
alter table public.payments disable row level security;
