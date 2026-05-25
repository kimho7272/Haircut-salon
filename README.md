# ✂️ Illy Hair - 미용실 관리 시스템

현대적이고 안전한 미용실 예약 관리 시스템입니다. **실제 배포 가능한** 보안 강화된 인증 시스템과 직관적인 UI로 미용실 운영을 효율화합니다.

## 🎯 주요 특징

### 🔐 **강화된 보안 시스템**
- **Supabase Auth** 기반 안전한 인증
- **JWT 토큰** 자동 관리 및 세션 보안
- **역할 기반 접근 제어** (관리자/스태프)
- **Row Level Security (RLS)** 데이터 보호

### 🌏 **다국어 지원**
- **한국어/영어** 완벽 지원
- 실시간 언어 전환
- 날짜/통화 현지화

### 📅 **직관적인 스케줄 관리**
- 7일 주간 캘린더 뷰
- 예약 상태별 색상 구분 (예약/완료)
- 드래그 앤 드롭 예약 관리
- 실시간 통계 대시보드

### ⚡ **빠른 예약 처리**
- 2-3 클릭으로 예약 완료
- 스마트 고객 검색
- 중복 고객 자동 감지
- 예약 이력 관리

## 🛠 기술 스택

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Authentication**: Supabase Auth (JWT)
- **Database**: PostgreSQL + Supabase
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel-ready
- **Icons**: Lucide React

## 🚀 빠른 시작

### 1. 저장소 복제 및 설치
```bash
git clone <repository-url>
cd haircut-salon
npm install
```

### 2. Supabase 프로젝트 설정
1. [Supabase](https://supabase.com) 프로젝트 생성
2. 프로젝트 URL과 API 키 확인

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 미용실 설정
NEXT_PUBLIC_SALON_NAME=Illy Hair
NEXT_PUBLIC_CURRENCY=USD
```

### 4. 데이터베이스 설정
Supabase 대시보드 → **SQL Editor**에서 실행:
```sql
-- supabase/setup_auth.sql 내용 복사하여 실행
```

### 5. 관리자 계정 생성
Supabase 대시보드 → **Authentication → Users**:
- **Add user** 클릭
- Email: `admin@illyhair.com`
- Password: `IllyHair123!`
- **Auto-confirm** 체크

### 6. 개발 서버 시작
```bash
npm run dev
```

## 🔑 로그인 정보

### 관리자 계정
- **Email**: admin@illyhair.com
- **Password**: IllyHair123!
- **역할**: 모든 기능 접근 가능

### 테스트 계정 추가
추가 스태프 계정 생성:
```sql
-- 스태프 계정 프로필 생성 (사용자 생성 후)
INSERT INTO user_profiles (user_id, name, role) 
VALUES ('user-id', 'Staff Member', 'staff');
```

## 📋 주요 기능

### 🔐 **인증 시스템**
- 안전한 이메일/패스워드 로그인
- 자동 세션 관리
- 로그아웃 확인 모달
- 보호된 라우트

### 📅 **스케줄 관리**
- 주간 캘린더 뷰
- 예약 추가/수정/삭제
- 고객 검색 및 등록
- 서비스 및 스태프 관리

### 📊 **대시보드**
- 실시간 예약 통계
- 오늘/이번 주 예약 현황
- 완료된 예약 추적

### 👥 **고객 관리**
- 고객 정보 등록/수정
- 예약 이력 조회
- 중복 고객 방지

## 🗂 프로젝트 구조

```
haircut-salon/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 페이지 (인증 필요)
│   │   └── layout.tsx            # 전역 레이아웃
│   ├── components/
│   │   ├── LoginForm.tsx         # 로그인 폼
│   │   ├── ProtectedRoute.tsx    # 라우트 보호
│   │   ├── Sidebar.tsx           # 사이드바 네비게이션
│   │   ├── SchedulePage.tsx      # 스케줄 관리
│   │   ├── AppointmentModal.tsx  # 예약 모달
│   │   └── LogoutConfirmModal.tsx # 로그아웃 확인
│   ├── contexts/
│   │   ├── AuthContext.tsx       # 인증 컨텍스트
│   │   └── LanguageContext.tsx   # 다국어 컨텍스트
│   └── lib/
│       ├── supabase.ts           # Supabase 클라이언트
│       └── supabase-auth.ts      # 인증 헬퍼
├── supabase/
│   └── setup_auth.sql            # 데이터베이스 스키마
└── .env.local                    # 환경 변수
```

## 🛡 보안 기능

### 인증 보안
- ✅ **패스워드 해싱** (bcrypt)
- ✅ **JWT 토큰** 자동 관리
- ✅ **세션 만료** 자동 처리
- ✅ **CSRF 보호** 내장

### 데이터 보안
- ✅ **Row Level Security (RLS)**
- ✅ **역할 기반 접근 제어**
- ✅ **SQL 인젝션 방지**
- ✅ **환경 변수 보호**

## 🌍 다국어 지원

### 지원 언어
- 🇰🇷 **한국어** (기본)
- 🇺🇸 **English**

### 현지화 기능
- 날짜 형식 (2024년 5월 24일 / May 24, 2024)
- 통화 형식 (₩1,000 / $10.00)
- 시간대 자동 감지

## 🚀 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 환경별 설정
- **개발**: localhost:3000
- **스테이징**: Vercel Preview
- **프로덕션**: 커스텀 도메인

## 🔧 개발 환경

### 요구사항
- Node.js 18+
- npm 또는 yarn
- Supabase 계정

### 개발 명령어
```bash
# 개발 서버
npm run dev

# 타입 체크
npm run type-check

# 린팅
npm run lint

# 프로덕션 빌드
npm run build

# 빌드 테스트
npm run start
```

## 📞 문제 해결

### 로그인 실패
1. Supabase 프로젝트 URL 확인
2. 사용자 계정 생성 여부 확인
3. 브라우저 콘솔 오류 확인

### 데이터베이스 오류
1. `setup_auth.sql` 실행 여부 확인
2. RLS 정책 상태 확인
3. 사용자 권한 확인

### 환경 변수 오류
1. `.env.local` 파일 존재 확인
2. `NEXT_PUBLIC_` 접두사 확인
3. 개발 서버 재시작

## 📈 로드맵

### 단기 계획
- [ ] 모바일 반응형 개선
- [ ] 예약 알림 기능
- [ ] 매출 분석 대시보드

### 장기 계획
- [ ] 모바일 앱 (React Native)
- [ ] SMS/이메일 알림
- [ ] 고객 온라인 예약 포털
- [ ] 재고 관리 시스템

---

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

**Made with ❤️ for 모든 미용실 사장님들**

🎯 **실제 비즈니스에 바로 사용 가능한 안전한 시스템**