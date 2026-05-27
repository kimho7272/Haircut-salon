-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Staff table (직원 관리)
create table public.staff (
    id uuid default uuid_generate_v4() primary key,
    username varchar(50) unique not null,
    password_hash text not null,
    name varchar(100) not null,
    role varchar(20) default 'staff' check (role in ('admin', 'staff')),
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers table (고객 정보)
create table public.customers (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    phone varchar(20),
    email varchar(255),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_visit timestamp with time zone,
    -- 전화번호가 있는 경우의 unique 제약조건
    constraint unique_name_phone_with_number unique (name, phone)
);

-- Services table (서비스 메뉴)
create table public.services (
    id uuid default uuid_generate_v4() primary key,
    name varchar(100) not null,
    price decimal(10,2) not null,
    duration integer not null default 60, -- minutes
    description text,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments table (예약 관리)
create table public.appointments (
    id uuid default uuid_generate_v4() primary key,
    customer_id uuid references public.customers(id) on delete cascade,
    staff_id uuid references public.staff(id) on delete set null,
    service_id uuid references public.services(id) on delete set null,
    appointment_date date not null,
    appointment_time time not null,
    duration integer not null default 60, -- minutes
    status varchar(20) default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
    notes text,
    payment_amount decimal(10,2), -- 결제 금액
    payment_method varchar(20) check (payment_method in ('cash', 'card')), -- 결제 방법
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Create unique constraint for customers without phone numbers
-- This ensures only one customer per name when phone is NULL or empty
create unique index unique_name_no_phone
  on public.customers (name)
  where phone is null or phone = '';

-- Create indexes for better performance
create index idx_appointments_date on public.appointments(appointment_date);
create index idx_appointments_customer on public.appointments(customer_id);
create index idx_appointments_staff on public.appointments(staff_id);
create index idx_customers_phone on public.customers(phone) where phone is not null;

-- Row Level Security (RLS) policies
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- RLS Policies (allow public access for development)
create policy "공개 읽기 - staff" on public.staff
  for select using (true);

create policy "공개 읽기 - customers" on public.customers
  for select using (true);

create policy "공개 읽기 - services" on public.services
  for select using (true);

create policy "공개 읽기 - appointments" on public.appointments
  for select using (true);

-- 쓰기 정책
create policy "모든 사용자 쓰기 - customers" on public.customers
  for all using (true) with check (true);

create policy "모든 사용자 쓰기 - appointments" on public.appointments
  for all using (true) with check (true);


-- Insert sample data for testing
insert into public.staff (username, password_hash, name, role) values
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQmyM7L8y5nF2fO', '관리자', 'admin'), -- password: admin123
('staff1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQmyM7L8y5nF2fO', '김미용', 'staff'), -- password: staff123
('staff2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewQmyM7L8y5nF2fO', '이스타일', 'staff'); -- password: staff123

insert into public.services (name, price, duration, description) values
('커트', 15000, 30, '기본 헤어 커트'),
('샴푸', 8000, 15, '기본 샴푸'),
('펌', 80000, 120, '일반 펌'),
('염색', 60000, 90, '기본 염색'),
('트리트먼트', 30000, 45, '모발 트리트먼트');

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_appointments_updated_at before update on public.appointments
    for each row execute procedure public.update_updated_at_column();