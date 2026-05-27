# ✂️ Illy Hair - 미용실 관리 시스템

현대적이고 안전한 미용실 예약 관리 시스템입니다. **실제 배포 가능한** 보안 강화된 인증 시스템과 직관적인 UI로 미용실 운영을 효율화합니다.

## 🎯 주요 특징

### 🔐 **강화된 보안 시스템**
- **Supabase Auth** 기반 안전한 인증
- **JWT 토큰** 자동 관리 및 세션 보안
- **역할 기반 접근 제어** (관리자/스태프)
- **Row Level Security (RLS)** 데이터 보호

### 🌏 **완전한 다국어 지원**
- **한국어/영어** 완벽 지원 (기본: 한국어)
- **실시간 언어 전환** - 새로고침 없이 즉시 변환
- **완전한 현지화**:
  - 날짜/통화 포맷 자동 변환
  - 차트 툴팁 다국어 지원
  - 기간 표시 ("주차" ↔ "week") 
- **로컬 스토리지** 언어 설정 저장

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
- **Charts**: Recharts (React + D3.js)
- **Date Management**: date-fns + 다국어 locale
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

### 📊 **고급 매출 관리 시스템**
- **3단계 계층 분석**: Daily → Weekly → Monthly
- **인터랙티브 차트**: Recharts 기반 반응형 그래프
- **다중 지표 추적**: 총매출/현금매출/카드매출/완료예약/미결제
- **기간별 세분화**:
  - **Daily**: 선택 주의 일별 매출 (7일 단위)
  - **Weekly**: 선택 월의 주별 매출 (월 단위)
  - **Monthly**: 선택 년의 월별 매출 (연 단위)
- **실시간 툴팁**: 다국어 지원 상세 정보
- **서비스별/스태프별** 매출 분석

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
│   │   ├── RevenueManagement.tsx # 매출 관리 (NEW!)
│   │   ├── CustomerManagement.tsx# 고객 관리
│   │   ├── ServiceManagement.tsx # 서비스 관리
│   │   ├── StaffManagement.tsx   # 직원 관리
│   │   ├── LanguageSelector.tsx  # 언어 선택기
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
- **날짜 형식**: 2024년 5월 24일 ↔ May 24, 2024
- **통화 형식**: ₩1,000 ↔ $10.00
- **기간 표시**: "22 주차 (05/24 ~ 05/30)" ↔ "22 week (05/24 ~ 05/30)"
- **차트 툴팁**: "매출: ₩1,000" ↔ "Revenue: $10.00"
- **언어 전환**: 실시간 UI 변환 (새로고침 불필요)

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

## 🆕 최근 업데이트 (2026.05.26)

### ✨ **매출 관리 시스템 대폭 개선**
- **기간 구조 재설계**: Weekly→Monthly→Yearly → **Daily→Weekly→Monthly**
- **3단계 계층 분석**:
  - **Daily**: 주간 일별 매출 (선택한 주의 7일)
  - **Weekly**: 월간 주별 매출 (선택한 월의 주차별)
  - **Monthly**: 연간 월별 매출 (선택한 년의 월별)
- **인터랙티브 차트**: Area Chart + 커스텀 툴팁
- **완전한 다국어 지원**: 차트/툴팁/기간표시 모두 현지화

### 🔧 **기술적 개선사항**
- **Recharts 도입**: 반응형 차트 라이브러리
- **date-fns 활용**: 다국어 날짜 포맷팅
- **언어 기본값**: 한국어 우선 설정
- **주별 매출 계산**: 월간 주차별 데이터 집계
- **UI/UX 최적화**: 공백 처리, 툴팁 개선

### 🐛 **해결된 이슈**
- ✅ 차트 툴팁 다국어 지원
- ✅ 기간 표시 완전 영문화 ("주차" → "week")
- ✅ 언어 설정 로컬 스토리지 저장
- ✅ 기본 언어 한국어 설정

## 📈 로드맵

### 단기 계획
- [ ] 모바일 반응형 개선
- [ ] 예약 알림 기능
- [x] ~~매출 분석 대시보드~~ ✅ **완료**

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