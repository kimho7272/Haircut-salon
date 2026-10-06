-- 운영자 콘솔 고도화: 활동 로그 + 미용실 메모
-- Supabase 대시보드 → SQL Editor에서 실행하세요.

-- 플랫폼 전체 활동 로그 (가입/플랜변경/정지/직원추가/운영자변경 등)
create table if not exists public.platform_audit_log (
  id uuid default uuid_generate_v4() primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type varchar(20) not null default 'platform_admin' check (actor_type in ('platform_admin', 'system')),
  action varchar(50) not null,
  target_salon_id uuid references public.salons(id) on delete set null,
  detail jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_log_created_at on public.platform_audit_log(created_at desc);
create index if not exists idx_audit_log_salon on public.platform_audit_log(target_salon_id);

-- RLS만 켜고 정책은 없음 (service role 전용 — 운영자 콘솔 서버 라우트에서만 접근)
alter table public.platform_audit_log enable row level security;

-- 미용실별 운영 메모 (지원 이력 등 운영자가 남기는 자유 텍스트)
alter table public.salons add column if not exists notes text;
