<img width="205" height="215" alt="c.horok_logo" src="https://github.com/user-attachments/assets/bfb7ba2d-724d-4c15-bcae-1be0d81c6ff2" />

<br>c.horok은 호록 컴퍼니의 기술 콘텐츠를 중심으로 운영하는 커뮤니티형 블로그 프로젝트입니다.

# 🧩 Version

<details>
<summary>🥚 v0.1.0</summary>

  > 기술 블로그
  
  ![이미지](https://github.com/user-attachments/assets/8f302e44-9123-452c-8d03-2d1dec0ad9bd)
    
  ### 🍽️ 기능
  1. 로그인
  - 아이디 및 비밀번호
  - 깃허브 OAuth 간편계정
  - 구글 OAuth 간편계정
    
  2. 탭
  - 홈
  - 피드
  - 좋아요
    
  3. 바로가기
  - 인기글
  - 카테고리
    
  4. 기능
  - 검색 (키워드 기반)
  - 라이트/다크 모드
  - 마이페이지 구경 (작성한 댓글, 글, 친구)
  - 회원탈퇴
  - 로그아웃
  - 잔디 (게시글 작성 기반)
  - 게시글 정렬 (최신, 조회, 좋아요, 댓글순 中 선택)
  - 게시글·댓글 작성, 수정, 삭제
    
  5. 관리자 페이지
    
  ![이미지](https://github.com/user-attachments/assets/b29f710d-e8b8-4667-a775-9fde63ce77a2)
    
  - 관리자 전용 접근 제어
  - 회원 목록 조회
  - 게시글 목록 조회 및 관리
  - 댓글 목록 조회 및 관리
  - 사용자 권한 변경
  - 사용자 삭제
  - 관리자 화면에서 게시글 생성/수정/삭제

  6. 게시글
  - 카테고리 자동 관리
  - 게시글 상세 페이지
  - 댓글 작성, 수정, 삭제
  - 대댓글 구조 지원
  - 좋아요한 글 목록 조회

</details>

<details>
<summary>🐣 v1.0.0</summary>

  > 기존 블로그 구조 위에 인증, 게시글/댓글/좋아요, 마이페이지, 관리자 기능, AI 챗봇, 이메일 로그인까지 통합한 상태로 확장을 마친 상태입니다.

  ### 🍽️ 기능
  1. 로그인
  - 이메일 매직 링크 로그인

  ![Mar-29-2026 15-10-05](https://github.com/user-attachments/assets/8c8cd01a-960f-4b4e-96ef-2b8618694d95)
  
  - 회원가입 시 이메일/닉네임 중복 확인

  ![Mar-29-2026 15-12-42](https://github.com/user-attachments/assets/efd38b28-d20f-4d78-b9c6-0edaf14dc0e7)

  - 비밀번호 재설정 및 계정 정보 수정

  ![Mar-29-2026 15-15-05](https://github.com/user-attachments/assets/1bf1aee7-6f73-4eae-9aae-975e9c66c9d3)

  2. 게시글
  - 게시글 작성, 수정, 삭제(소프트 삭제)
  - Markdown 기반 게시글 작성 및 렌더링
  - 썸네일 이미지 업로드
  - 조회수 집계
  - 알림 데이터 모델 구성

  3. 마이페이지
  - 내가 작성한 글 목록
  - 내가 작성한 댓글 목록
  - 친구 목록
  - 탭 쿼리스트링 기반 섹션 이동

  4. AI
  - Google Generative AI 기반 Horok 챗봇
  - 우하단 플로팅 챗봇 UI
  - 스트리밍 응답 처리

</details>

<details>
<summary>🐤 v2.0.0 <i>(In progress..)</i></summary>

  > Horok 통합 페이지 만들기
  
  1️⃣ 소개
    
  2️⃣ 기술 블로그
  - 영상(애니메이션)
  - 네컷만화
  - 추천 카테고리 노출
    
  3️⃣ Shop (*Coming Soon..*)

</details>

# 🤖 Tech
|Frontend|Backend|
|:---:|:---:|
|Next.js 16|Next.js Route Handlers|
|React 19|Prisma|
|TypeScript|PostgreSQL|
|Tailwind CSS 4|Supabase Storage|
||NextAuth v5 beta|
||Nodemailer|
||Google Gemini 2.5 Flash|

# 🚀 Run Server 
```bash
pnpm install
pnpm dev
```
