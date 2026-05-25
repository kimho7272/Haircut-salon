-- Supabase Auth 사용자 프로필 테이블 설정
-- Supabase 대시보드 → SQL Editor에서 실행하세요

-- 1. 사용자 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. 실제 작동하는 RLS 정책 설정
-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- 인증된 사용자는 모든 프로필을 읽을 수 있음 (단순화)
CREATE POLICY "Allow authenticated users to read profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 사용자는 본인의 프로필만 관리 가능
CREATE POLICY "Allow users to manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. updated_at 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE
  ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. 관리자 계정 생성 방법 (권장)
-- 방법 1: Supabase 대시보드 사용
-- Authentication → Users → Add user
-- Email: admin@illyhair.com
-- Password: IllyHair123!
-- Auto confirm: 체크

-- 방법 2: 수동 프로필 생성 (사용자 생성 후 실행)
-- INSERT INTO user_profiles (user_id, name, role)
-- VALUES ('실제-user-id', 'Administrator', 'admin');

-- 7. 테스트용 임시 RLS 비활성화 (문제 발생 시)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- (문제 해결 후 다시 활성화: ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;)