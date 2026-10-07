-- 고객 셀프 예약 + 예약 리마인더 이메일 지원
-- Supabase 대시보드 → SQL Editor에서 실행하세요.

-- 어떤 경로로 예약이 생성됐는지 (온라인 셀프 예약 vs 직원이 직접 입력)
alter table public.appointments add column if not exists booking_source varchar(20) not null default 'staff' check (booking_source in ('staff', 'online'));

-- 리마인더 이메일을 이미 보냈는지 (중복 발송 방지용)
alter table public.appointments add column if not exists reminder_sent_at timestamp with time zone;

-- 크론이 "아직 리마인더 안 보낸 내일 예약"을 빠르게 찾기 위한 인덱스
create index if not exists idx_appointments_reminder_lookup
  on public.appointments (appointment_date, reminder_sent_at)
  where status = 'scheduled';

-- customers의 "이름+전화번호 중복방지" 제약이 salon_id 없이 전체 테이블 기준으로 걸려있던
-- 기존 버그 수정: 멀티테넌트 전환(002) 당시 salon_id 컬럼만 추가하고 이 제약은 그대로
-- 남아서, 서로 다른 미용실에 동명+동일 전화번호 고객이 있으면 가입이 막혀버림.
-- 셀프 예약으로 고객 수가 늘어나기 전에 미용실 단위로 스코프를 좁혀야 함.
-- (이름은 그대로 유지 — 앱 코드가 이 제약 이름으로 "중복 고객" 에러를 구분해서 처리함)
alter table public.customers drop constraint if exists unique_name_phone_with_number;
drop index if exists unique_name_no_phone;

alter table public.customers add constraint unique_name_phone_with_number unique (salon_id, name, phone);

create unique index unique_name_no_phone
  on public.customers (salon_id, name)
  where phone is null or phone = '';
