# c.horok

`c.horok`는 Next.js App Router 기반의 기술 커뮤니티/블로그 애플리케이션입니다. 이 문서는 현재 저장소의 코드와 스키마를 기준으로, 구현된 기능과 구조를 객관적으로 정리한 기술 문서입니다.

## 1. 프로젝트 개요

- 프레임워크: Next.js 16.1.1
- 런타임 UI: React 19.2.3
- 언어: TypeScript 5
- 스타일링: Tailwind CSS 4
- 데이터베이스: PostgreSQL
- ORM: Prisma 7.4.2
- 인증: NextAuth v5 beta (`jwt` 세션 전략)
- 파일 스토리지: Supabase Storage
- 메일 전송: Nodemailer
- AI 챗봇: Vercel AI SDK + Google Gemini 2.5 Flash
- 컴포넌트 문서화: Storybook 10
- 정적 검사/포맷팅: Biome 2.2.0
- 테스트 도구 의존성: Vitest 4, Playwright

## 2. 구현 범위

코드 기준으로 확인되는 주요 기능은 다음과 같습니다.

- 게시글 CRUD
- 댓글/대댓글 작성 및 소프트 삭제
- 게시글 좋아요 및 좋아요 상태 조회
- 게시글 조회수 집계
- 카테고리 기반 조회 및 추천 카테고리 노출
- 검색 페이지 및 검색 API
- 마이페이지: 내 글, 내 댓글, 친구, 활동 통계
- 사용자 프로필 조회
- 알림 조회 및 읽음 처리
- 관리자 페이지: 사용자/게시글/댓글 관리
- 인증: 이메일+비밀번호, GitHub OAuth, Google OAuth, 이메일 매직 링크
- 프로필 이미지 및 게시글 썸네일 업로드
- Markdown 기반 게시글 작성/렌더링
- 공지사항 페이지
- AI 챗봇 페이지 및 `/api/chat` 스트리밍 응답

<<<<<<< Updated upstream
<details open>
<summary>🐣 v1.0.0</summary>
=======
현재 코드상 준비 중인 화면:
>>>>>>> Stashed changes

- `/videos`
- `/coding-tests`

## 3. 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Web App | Next.js App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, `class-variance-authority`, `tailwind-merge` |
| Auth | NextAuth v5 beta, Credentials, GitHub, Google, Nodemailer provider |
| DB | PostgreSQL, Prisma |
| Storage | Supabase Storage |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-sanitize` |
| AI | `ai`, `@ai-sdk/react`, `@ai-sdk/google` |
| Tooling | Biome, Storybook, Vitest, Playwright |

## 4. 아키텍처 요약

### Frontend

- `src/app`: App Router 기반 페이지, 메타데이터, API Route Handler
- `src/components`: 레이아웃, 게시글, 인증, 마이페이지, 사이드바, 챗봇 UI
- `src/components/posts/PostEditor.tsx`: Markdown 작성기, 썸네일/본문 이미지 업로드 처리

### Backend

- `src/app/api/**/route.ts`: 서버 API 엔드포인트
- `src/lib/db.ts`, `src/lib/posts.ts`, `src/lib/comments.ts`, `src/lib/queries.ts`: Prisma 기반 도메인 로직
- `src/lib/auth-adapter.ts`: NextAuth용 사용자/매직링크 토큰 어댑터
- `src/lib/email.ts`: SMTP 구성 및 로그인 링크 이메일 템플릿
- `src/lib/supabase.ts`: Supabase client 초기화

### Layout

- 전역 레이아웃은 `Header`, `BannerBar`, 좌측 사이드바(`UserProfiles`, `PopularPosts`, `RecommendedCategories`), 메인 콘텐츠 영역, `HorokChat`으로 구성됩니다.
- 다크 모드는 `localStorage("theme")` 값을 읽는 인라인 스크립트로 초기화됩니다.

## 5. 디렉터리 구조

```text
.
├─ prisma/
│  └─ schema.prisma
├─ public/
├─ scripts/
│  └─ cleanup-posts.mjs
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ admin/
│  │  ├─ chat/
│  │  ├─ feed/
│  │  ├─ likes/
│  │  ├─ mypage/
│  │  ├─ notices/
│  │  ├─ posts/
│  │  ├─ search/
│  │  ├─ users/
│  │  └─ videos/
│  ├─ components/
│  ├─ lib/
│  ├─ stories/
│  └─ types/
├─ next.config.ts
├─ package.json
└─ prisma.config.ts
```

## 6. 데이터 모델

Prisma 스키마 기준 핵심 엔터티는 아래와 같습니다.

- `User`: 사용자 계정, 권한, 인증 공급자 정보
- `Category`: 게시글 카테고리
- `Post`: 게시글 본문, 썸네일, 소프트 삭제 상태
- `Comment`: 댓글/대댓글(1단계 깊이)
- `PostLike`: 게시글-사용자 다대다 좋아요 연결
- `PostView`: 게시글별 조회수 집계
- `Friend`: 사용자 간 친구 관계
- `Notification`: 댓글/좋아요 등 활동 알림
- `VerificationToken`: 이메일 매직 링크 토큰
- `StopWord`: 금칙어 저장 테이블

### ERD

```mermaid
erDiagram
  User ||--o{ Post : writes
  User ||--o{ Comment : writes
  User ||--o{ PostLike : likes
  User ||--o{ Friend : user
  User ||--o{ Friend : friend_user
  User ||--o{ Notification : receives
  User ||--o{ Notification : acts

  Category ||--o{ Post : classifies

  Post ||--o{ Comment : has
  Post ||--o{ PostLike : has
  Post ||--|| PostView : has
  Post ||--o{ Notification : triggers

  Comment ||--o{ Comment : replies
  Comment ||--o{ Notification : triggers

  User {
    bigint id PK
    varchar email UK
    varchar password
    varchar name
    varchar image
    varchar oauth_image
    enum role
    enum provider
    varchar sns_id UK
    boolean is_blocked
    timestamptz created_at
    timestamptz updated_at
  }

  Category {
    bigint id PK
    varchar name
    varchar slug UK
    timestamptz created_at
  }

<<<<<<< Updated upstream
## 1. 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Web App | Next.js App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, `class-variance-authority`, `tailwind-merge` |
| Auth | NextAuth v5 beta, Credentials, GitHub, Google, Nodemailer provider |
| DB | PostgreSQL, Prisma |
| Storage | Supabase Storage |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-sanitize` |
| AI | `ai`, `@ai-sdk/react`, `@ai-sdk/google` |
| Tooling | Biome, Storybook, Vitest, Playwright |

## 🚀 Run Server
=======
  Post {
    bigint id PK
    bigint user_id FK
    bigint category_id FK
    varchar title
    text content
    varchar thumbnail
    boolean is_deleted
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  Comment {
    bigint id PK
    bigint post_id FK
    bigint user_id FK
    bigint parent_id FK
    text content
    boolean is_deleted
    timestamptz created_at
    timestamptz updated_at
  }

  PostLike {
    bigint post_id PK, FK
    bigint user_id PK, FK
    timestamptz created_at
  }

  PostView {
    bigint post_id PK, FK
    bigint view_count
    timestamptz updated_at
  }

  Friend {
    bigint id PK
    bigint user_id FK
    bigint friend_user_id FK
    timestamptz created_at
  }

  Notification {
    bigint id PK
    bigint user_id FK
    bigint actor_id FK
    bigint post_id FK
    bigint comment_id FK
    varchar type
    varchar content
    boolean is_read
    timestamptz created_at
  }

  VerificationToken {
    varchar identifier PK
    varchar token PK
    timestamptz expires
  }
```

## 7. 인증 및 권한

### 인증 공급자

코드에서 확인되는 로그인 방식:

- Credentials (`email` + `password`)
- GitHub OAuth
- Google OAuth
- Nodemailer 기반 이메일 매직 링크

### 세션

- NextAuth `session.strategy = "jwt"`
- 세션에 `user.id`, `role`, `provider`, `image`, `oauthImage`를 주입

### 권한

- `Role` enum: `USER`, `ADMIN`
- 관리자 화면 `/admin`은 서버 측에서 `session.user.role === "ADMIN"`일 때만 접근
- 게시글 수정/삭제 API는 작성자 본인만 허용

### 사용자 저장 방식

- OAuth 계정 정보는 `users.provider`, `users.sns_id`에 저장
- 매직 링크 토큰은 `verification_tokens` 테이블에 저장
- `src/lib/auth-adapter.ts`에서 `verification_tokens` 테이블을 없으면 생성하도록 구현

## 8. 페이지 라우트

코드 기준 페이지 경로:

| 경로 | 설명 |
| --- | --- |
| `/` | 메인 페이지, 활동 잔디 + 내 글/랜덤 글 |
| `/feed` | 전체 게시글 피드 |
| `/likes` | 좋아요한 게시글 |
| `/search` | 검색 결과 또는 카테고리 결과 |
| `/posts/new` | 새 게시글 작성 |
| `/posts/[id]` | 게시글 상세 |
| `/mypage` | 마이페이지 |
| `/users/[id]` | 사용자 프로필 |
| `/notices` | 공지사항 목록 |
| `/notices/[slug]` | 공지사항 상세 |
| `/chat` | Horok 챗봇 페이지 |
| `/admin` | 관리자 페이지 |
| `/videos` | 준비 중인 영상 페이지 |
| `/coding-tests` | 준비 중인 코딩테스트 페이지 |

참고:

- 공지사항은 DB가 아니라 `src/lib/notices.ts`의 정적 배열로 관리됩니다.

## 9. API 엔드포인트

대표적인 Route Handler는 아래와 같습니다.

### 인증/회원

- `POST /api/auth/[...nextauth]`
- `POST /api/signup`
- `POST /api/users/signup`
- `GET /api/users/check-email`
- `GET /api/users/check-name`
- `POST /api/users/find-email`
- `POST /api/users/reset-password`
- `PATCH /api/user/update`
- `POST /api/user/verify-password`
- `DELETE /api/user/delete`

### 게시글/댓글/좋아요

- `GET, POST /api/posts`
- `GET, PUT, DELETE /api/posts/[id]`
- `POST /api/posts/[id]/view`
- `GET, POST /api/posts/[id]/comments`
- `POST /api/comments`
- `POST /api/posts/[id]/like`
- `GET /api/posts/[id]/like/status`
- `GET /api/posts/popular`
- `GET /api/likes/posts`

### 검색/카테고리

- `GET /api/search`
- `GET /api/categories/[slug]/posts`
- `GET /api/categories/recommended`
- `GET /api/keywords/recommended`

### 마이페이지/사용자

- `GET /api/mypage/stats`
- `GET /api/mypage/posts`
- `GET /api/mypage/comments`
- `GET /api/mypage/friends`
- `GET /api/users/[id]/profile`
- `GET /api/users/contributions`
- `POST /api/friends`

### 알림/기타

- `GET /api/notifications`
- `POST /api/notifications/[id]/read`
- `POST /api/chat`
- `GET /api/test-db`

## 10. 게시글 및 콘텐츠 처리 방식

### 게시글

- 게시글은 `posts.is_deleted`를 이용해 소프트 삭제됩니다.
- 카테고리는 글 생성/수정 시 이름 기준으로 보정되며, 사용 중인 글이 없으면 정리 로직이 실행됩니다.
- 조회수는 `post_views` 테이블에 별도로 누적됩니다.

### 댓글

- 댓글은 `comments.parent_id`를 사용해 계층 구조를 가집니다.
- API 기준 대댓글 깊이는 1단계까지만 허용됩니다.
- 삭제는 소프트 삭제(`is_deleted`) 방식입니다.

### 좋아요

- `post_likes`는 `(post_id, user_id)` 복합 PK를 사용합니다.

### Markdown

- 작성기에서 제목, 정렬, 코드블록, 인용, 리스트, 체크리스트, 표, 링크, 이미지, 동영상 삽입 템플릿을 지원합니다.
- 렌더링은 `react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-sanitize` 조합입니다.

## 11. 파일 업로드

Supabase Storage를 사용합니다.

- 게시글 썸네일 버킷: `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` 또는 기본값 `post-thumbnails`
- 프로필 이미지 버킷: `NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET` 우선, 없으면 `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, 최종 기본값 `post-thumbnails`

업로드 경로 생성 규칙:

- 게시글 썸네일: `public/thumbnails/<uuid>-<sanitized-file-name>`
- 본문 이미지: `public/content/<uuid>-<sanitized-file-name>`
- 프로필 이미지: `public/<userId>/<uuid>-<sanitized-file-name>`

## 12. 검색 및 정렬

### 검색

- `/search` 페이지는 키워드 검색과 카테고리 슬러그 검색을 모두 처리합니다.
- 검색 전처리는 `src/lib/search.ts`에서 소문자화, 특수문자 제거, 2글자 이상 토큰만 유지하도록 구현되어 있습니다.

### 정렬

여러 게시글 목록은 공통 정렬 유틸을 사용하며 다음 지표를 기준으로 정렬할 수 있습니다.

- 최신순
- 조회순
- 좋아요순
- 댓글순

## 13. 환경 변수

코드에서 직접 참조하는 환경 변수는 다음과 같습니다.

| 변수명 | 용도 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `GITHUB_CLIENT_ID` | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini 챗봇 |
| `EMAIL_SERVER_HOST` | SMTP 호스트 |
| `EMAIL_SERVER_PORT` | SMTP 포트 |
| `EMAIL_SERVER_USER` | SMTP 계정 |
| `EMAIL_SERVER_PASSWORD` | SMTP 비밀번호 |
| `EMAIL_FROM` | 발신자 이메일 |
| `EMAIL_LOGO_URL` | 이메일 템플릿 로고 URL, 선택값 |
| `NEXT_PUBLIC_BASE_URL` | 사이트 절대 URL 생성용 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | 게시글 스토리지 버킷명, 선택값 |
| `NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET` | 프로필 스토리지 버킷명, 선택값 |

## 14. 로컬 실행

### 1) 의존성 설치

>>>>>>> Stashed changes
```bash
pnpm install
```

### 2) 환경 변수 설정

`.env.local`에 최소한 아래 값을 설정해야 합니다.

```env
DATABASE_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_GENERATIVE_AI_API_KEY=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=post-thumbnails
NEXT_PUBLIC_SUPABASE_PROFILE_BUCKET=profile-images
```

### 3) Prisma Client 생성 및 개발 서버 실행

```bash
pnpm prisma:generate
pnpm dev
```

브라우저 기본 주소:

```text
http://localhost:3000
```

## 15. 사용 가능한 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | Prisma Client 생성 후 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | Biome 검사 |
| `pnpm format` | Biome 포맷 |
| `pnpm prisma:generate` | Prisma Client 생성 |
| `pnpm prisma:validate` | Prisma 스키마 검증 |
| `pnpm prisma:pull` | DB 스키마 pull |
| `pnpm prisma:push` | DB에 스키마 push |
| `pnpm prisma:studio` | Prisma Studio 실행 |
| `pnpm cleanup:posts` | 게시글 정리 스크립트 실행 |
| `pnpm storybook` | Storybook 개발 서버 |
| `pnpm build-storybook` | Storybook 정적 빌드 |

## 16. 구현상 확인된 특징

- Next.js `reactCompiler: true`가 활성화되어 있습니다.
- `next.config.ts`에서 GitHub, Google, Supabase 원격 이미지를 허용합니다.
- 메타데이터의 기본 언어는 `ko`, Open Graph 정보가 설정되어 있습니다.
- 관리자 기능 일부는 별도 API가 아니라 `/admin` 페이지 내부의 서버 액션으로 구현되어 있습니다.
- 공지사항은 데이터베이스 엔터티가 아니라 애플리케이션 코드의 정적 데이터입니다.

## 17. 참고 파일

- Prisma 스키마: [prisma/schema.prisma](/Users/horok/Desktop/dev/c.horok/prisma/schema.prisma)
- NextAuth 라우트: [src/app/api/auth/[...nextauth]/route.ts](/Users/horok/Desktop/dev/c.horok/src/app/api/auth/[...nextauth]/route.ts)
- 전역 레이아웃: [src/app/layout.tsx](/Users/horok/Desktop/dev/c.horok/src/app/layout.tsx)
- 게시글 작성기: [src/components/posts/PostEditor.tsx](/Users/horok/Desktop/dev/c.horok/src/components/posts/PostEditor.tsx)
- 게시글 도메인 로직: [src/lib/posts.ts](/Users/horok/Desktop/dev/c.horok/src/lib/posts.ts)
- 댓글 도메인 로직: [src/lib/comments.ts](/Users/horok/Desktop/dev/c.horok/src/lib/comments.ts)
- 검색/목록 쿼리: [src/lib/queries.ts](/Users/horok/Desktop/dev/c.horok/src/lib/queries.ts)
