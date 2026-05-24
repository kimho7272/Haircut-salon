-- RLS 정책 수정: 인증 없이도 읽기 가능하도록 변경
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow authenticated access" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.services;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.payments;

-- 새로운 정책: 읽기는 누구나, 쓰기는 인증된 사용자만
CREATE POLICY "Allow public read access" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write access" ON public.staff FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write access" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write access" ON public.services FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write access" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write access" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- 데이터 확인
SELECT 'Staff count:' as info, count(*) as count FROM staff;
SELECT 'Customers count:' as info, count(*) as count FROM customers;
SELECT 'Services count:' as info, count(*) as count FROM services;