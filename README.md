# 🚀 미용실 스케쥴 관리 시스템

간편하고 직관적인 미용실 예약 관리 시스템입니다. 고객 스케쥴의 입력/변경/삭제가 매우 쉽고 한눈에 파악하기 쉽도록 설계되었습니다.

## ✨ 주요 기능

### 📅 직관적인 주간 캘린더
- 7일 주간 캘린더로 한눈에 예약 현황 파악
- 오늘 날짜 하이라이트 및 쉬운 네비게이션
- 예약 상태별 색상 구분 (예약됨/완료/취소)

### ⚡ 빠른 예약 관리
- **클릭 2-3번으로 예약 완료**
- 고객 검색 및 신규 고객 등록
- 드롭다운으로 서비스/시간/담당자 선택
- 원클릭 예약 수정/삭제

### 📊 실시간 통계
- 일간/주간 예약 현황
- 완료된 예약 및 매출 현황
- 직관적인 대시보드

## 🛠 기술 스택

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time API)
- **Deployment**: Vercel + Supabase
- **Icons**: Lucide React

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일에 Supabase 설정:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 데이터베이스 스키마 실행
Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 실행

### 4. 개발 서버 시작

**방법 1: 자동 재시작 스크립트 (추천)**
```powershell
.\run.ps1
```

**방법 2: 빠른 재시작**
```powershell
.\restart.ps1
```

**방법 3: 일반 명령어**
```bash
npm run dev
```

## 📋 스크립트 사용법

### `run.ps1` - 상세한 서버 관리
```powershell
.\run.ps1
```
- ✅ 기존 서버 자동 종료
- ✅ 환경 설정 검증
- ✅ 상세한 로그 출력
- ✅ 오류 시 해결 방법 안내

### `restart.ps1` - 빠른 재시작
```powershell
.\restart.ps1
```
- ⚡ 빠른 서버 종료 및 재시작
- 💡 간단한 디버깅용

## 🎯 사용 방법

### 예약 추가
1. 원하는 날짜에서 **"예약 추가"** 클릭
2. 고객 검색 또는 신규 등록
3. 시간/서비스/담당자 선택 후 저장

### 예약 수정/삭제
1. 예약 카드의 **✏️ 수정** 또는 **🗑️ 삭제** 클릭
2. 정보 수정 후 저장

### 주간 네비게이션
- **이전 주/다음 주**: 날짜 이동
- **오늘**: 현재 주로 돌아오기

## 📱 브라우저 지원

- ✅ Chrome (최신)
- ✅ Edge (최신)  
- ✅ Firefox (최신)
- ✅ Safari (최신)
- ✅ 모바일 브라우저

## 🔧 개발 환경

### 요구사항
- Node.js 18+
- npm 또는 yarn
- PowerShell (Windows)

### 개발 도구
```bash
# 타입 체크
npm run type-check

# 린팅
npm run lint

# 빌드
npm run build
```

## 🗂 프로젝트 구조

```
haircut-salon/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # 메인 스케쥴 페이지
│   │   └── layout.tsx       # 전역 레이아웃
│   ├── components/          # 재사용 컴포넌트
│   │   └── AppointmentModal.tsx  # 예약 모달
│   └── lib/
│       └── supabase.ts      # Supabase 클라이언트 설정
├── supabase/
│   └── schema.sql           # 데이터베이스 스키마
├── run.ps1                  # 상세 서버 관리 스크립트
├── restart.ps1              # 빠른 재시작 스크립트
└── .env.local               # 환경 변수
```

## 🛡 보안

- **Row Level Security (RLS)**: 데이터 접근 제어
- **환경 변수**: 민감한 정보 보호
- **타입 안전성**: TypeScript로 런타임 오류 방지

## 📞 지원

문제가 발생하면:
1. `run.ps1` 스크립트 실행으로 진단
2. 브라우저 콘솔 확인 (F12)
3. Supabase 대시보드에서 데이터 확인

## 📈 향후 계획

- [ ] 모바일 앱 (React Native)
- [ ] SMS 알림 기능
- [ ] 매출 상세 분석
- [ ] 고객 로열티 시스템
- [ ] 온라인 예약 페이지

---

**Made with ❤️ for 미용실 사장님들**