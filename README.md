# 임장 스터디 관리 프로그램

부동산 임장 스터디(주중반/주말반, 약 20명)를 위한 웹 관리 프로그램입니다.
조원 전원이 각자 계정으로 로그인하여 일정·보고서·물건·피드백·게시판을 함께 사용합니다.

## 주요 기능

- **조원 관리**: 권한(운영자/조원)·반(주중/주말) 설정, 조 편성 (운영자)
- **임장 일정/계획**: 날짜·시간·집결지·동선 등록, 반/상태별 검색 (운영자 작성, 전원 열람)
- **임장 희망 물건**: 거래유형·가격·면적·준공·세대수·원문 링크·검토상태 관리
- **임장 보고서**: 양식 작성(개요/입지/시세/장단점/총평/평점) + 일정·물건 연결 + 파일 첨부
- **피드백**: 보고서·물건에 대한 평점/코멘트
- **게시판**: 공지/자료/잡담, 댓글, 상단 고정(운영자)
- **개인 메모**: 본인만 볼 수 있는 메모
- **대시보드**: 다가오는 일정, 최근 보고서/물건 요약

## 기술 스택

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS v4
- [Supabase](https://supabase.com/) (Auth · Postgres · Storage · RLS)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com/dashboard) 에서 새 프로젝트를 생성합니다.
2. **SQL Editor** 에서 `supabase/migrations/`의 SQL 파일을 번호 순서대로 실행합니다.
   (테이블, RLS 정책, 인증 프로필 트리거, Storage `reports` 버킷이 생성됩니다.)
3. 기존 배포를 업데이트하는 경우에도 아직 적용하지 않은 마이그레이션을 반드시 실행합니다.
4. (선택) `supabase/seed.sql` 을 실행하면 샘플 조/물건이 생성됩니다.

### 3. 환경 변수 설정

`.env.example` 을 복사해 `.env.local` 을 만들고, Supabase 프로젝트의
`Project Settings > API` 값을 채웁니다.

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속 → 회원가입 → 로그인.

### 5. 운영자(admin) 지정

첫 가입 후, 운영자로 만들 계정을 Supabase **SQL Editor** 에서 지정합니다.

```sql
update public.profiles set role = 'admin' where email = '본인이메일@example.com';
```

운영자만 일정 등록/수정, 조 편성, 조원 권한 변경이 가능합니다.

## 배포 (Vercel)

1. 이 저장소를 GitHub 에 올립니다.
2. [Vercel](https://vercel.com/) 에서 import 후, 환경 변수
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 등록합니다.
3. 운영자 비밀번호 초기화를 사용할 경우 `SUPABASE_SERVICE_ROLE_KEY`도 서버 환경 변수로 등록합니다.
4. 배포합니다. Supabase Auth의 Site URL과 Redirect URL에 배포 도메인 및
   `https://배포도메인/auth/callback`을 추가하세요.

## 디렉터리 구조

```
app/
  (auth)/           로그인·회원가입
  (app)/            로그인 후 영역
    dashboard/      대시보드
    schedules/      임장 일정/계획
    reports/        보고서 (작성 + 파일 업로드)
    properties/     임장 물건 + 피드백
    board/          게시판 + 댓글
    memos/          개인 메모
    members/        조원·조 관리 (운영자)
components/         UI 컴포넌트 (shadcn/ui)
lib/
  supabase/         서버·브라우저·미들웨어 클라이언트
  auth.ts           프로필/권한 헬퍼
  types.ts          도메인 타입
supabase/
  migrations/       DB 스키마 + RLS
  seed.sql          샘플 데이터
```

## 권한 모델 (RLS) 요약

- 로그인한 조원: 모든 콘텐츠 열람 가능
- 작성자/운영자: 본인(또는 전체) 콘텐츠 수정·삭제
- 일정·조 편성: 운영자만 작성/수정
- 개인 메모: 본인만 접근

## 보안 패치 내역

### v0.2.0 (2026-06-17)

#### [CRITICAL] Storage 파일 경로 주입 취약점 수정

`deleteReportFile` Server Action이 `storage_path`를 사용자 입력(FormData)에서 직접 받아
임의 파일 삭제가 가능했던 문제를 수정했습니다.

- **수정 전**: `storage_path`를 FormData에서 신뢰하여 Storage에서 임의 경로 삭제 가능
- **수정 후**: `file_id`로 DB를 조회해 `storage_path` 취득 (RLS가 소유권 검증)
- **파일**: `app/(app)/reports/actions.ts`

#### [CRITICAL] Storage 버킷 정책 강화

`reports` 버킷의 업로드·삭제 정책이 인증된 사용자 전체에게 허용되어
타인의 보고서 폴더에 파일 업로드가 가능했던 문제를 수정했습니다.

- **수정 전**: 인증된 사용자면 누구든 업로드·삭제 가능
- **수정 후**: 업로드는 해당 보고서 작성자, 삭제는 작성자 또는 운영자만 허용
- **파일**: `supabase/migrations/0004_storage_rls_fix.sql` (적용 필요)

#### [HIGH] 파일 업로드 검증 추가

서버 측 검증 없이 모든 형식·크기의 파일을 업로드할 수 있었던 문제를 수정했습니다.

- **수정 내용**: 허용 확장자 화이트리스트(PDF, HWP, PPT, DOC, 이미지 등) 및 최대 20MB 제한
- **파일**: `app/(app)/reports/report-form.tsx`

#### [HIGH] 임시 비밀번호 난수 생성기 교체

`Math.random()`(비암호학적 난수)으로 임시 비밀번호를 생성하던 문제를 수정했습니다.

- **수정 전**: `Imjang${Math.random()...}!` — 고정 패턴 + 31비트 엔트로피
- **수정 후**: `crypto.randomBytes(12).toString("base64url")` — 96비트 엔트로피
- **파일**: `app/(app)/members/actions.ts`

#### [MEDIUM] 리치텍스트 링크 탭내빙(Tabnapping) 방지

`target="_blank"` 링크에서 `rel` 속성을 사용자가 제어할 수 있어
`window.opener`를 통한 탭내빙 공격이 가능했던 문제를 수정했습니다.

- **수정 내용**: DOMPurify hook으로 `target="_blank"` 링크에 `rel="noopener noreferrer"` 강제 적용
- **파일**: `lib/sanitize.ts`

#### [MEDIUM] 조원 역할·반 입력값 검증 추가

`updateMember` Server Action에서 `role`, `cohort` 값을 검증 없이 DB에 전달하던
문제를 수정했습니다.

- **수정 내용**: 허용값(`admin`/`member`, `weekday`/`weekend`) 외 입력 시 조기 반환
- **파일**: `app/(app)/members/actions.ts`

#### [MEDIUM] 회원가입 에러 메시지 추상화

Supabase 내부 에러 메시지를 그대로 노출해 계정 존재 여부를 확인할 수 있었던
문제를 수정했습니다.

- **수정 내용**: 회원가입 실패 시 일반화된 메시지 반환
- **파일**: `app/(auth)/actions.ts`

### 마이그레이션 적용 안내

`v0.2.0` 패치 적용 시 Supabase SQL Editor에서 아래 파일을 반드시 실행하세요.

```sql
-- supabase/migrations/0004_storage_rls_fix.sql 내용 실행
```

## v0.3.0 임장 업무·보안 개선

- 일시중지된 Supabase 프로젝트 복구 및 인증 오류 로깅 보완
- 비밀번호 찾기/재설정과 프로필 자동 복구 추가
- 물건 검토상태, 거래유형, 가격, 면적, 준공연도, 세대수, 원문 링크 추가
- 일정 시간·집결 장소와 일정/물건 검색 필터 추가
- 보고서의 물건 개요, 입지, 가격·시세, 장단점 구조화 입력 복원
- 보고서 작성 시 연결 일정·물건을 직접 선택하도록 개선
- 게시글·댓글·메모·물건·보고서 변경 작업의 서버 권한 검증 강화
- 보고서 Storage 파일 크기·확장자·UPDATE 권한을 서버 정책으로 제한
- 위험한 삭제 작업에 확인 절차 추가
- 조장 지정 기능과 서울 시간대 기준 대시보드 날짜 처리 추가

### 운영 DB 적용

기존 Supabase 프로젝트에는 아래 파일을 순서대로 실행해야 합니다.

```sql
-- supabase/migrations/0006_auth_profile_repair.sql
-- supabase/migrations/0007_domain_security_hardening.sql
```

마이그레이션 적용 후 애플리케이션 코드를 배포하세요.
