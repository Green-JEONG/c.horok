import type { RowDataPacket } from "mysql2/promise";

// ⚠️ MySQL 서버가 꺼져 있어 Next.js가 아예 연결 시도를 하지 않도록, DB 연결 환경변수 체크 및 실제 연결(pool) 부분은 주석 처리 또는 가짜로 대체

export const pool = {
  query: async () => [[]],
} as any;

export type DbUser = {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  provider: "credentials" | "github" | "google";
  github_id: string | null;
};

export type DbPost = {
  id: number;
  title: string;
  content: string;
  created_at: Date;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
};

export type DbContribution = {
  date: string;
  count: number;
};

// 공통으로 사용할 임시(Mock) 데이터
const MOCK_USER: DbUser = {
  id: "test-user-id",
  email: "test@example.com",
  password: "hashed_password",
  name: "UI테스터",
  role: "USER",
  provider: "credentials",
  github_id: null,
};

const MOCK_POST: DbPost = {
  id: 1,
  title: "DB 없이 띄운 임시 게시글입니다",
  content:
    "MySQL 서버가 꺼져 있어도 UI 작업을 할 수 있도록 세팅된 가짜 데이터입니다.",
  created_at: new Date(),
  author_name: "UI테스터",
  category_name: "개발",
  likes_count: 10,
  comments_count: 3,
};

// 가짜 데이터를 반환하는 함수들
export async function findUserByEmail(email: string) {
  return MOCK_USER;
}

export async function createUser(params: any) {
  return MOCK_USER;
}

export async function deleteUserById(userId: string) {
  return; // 삭제 로직 무시
}

export async function upsertOAuthUser(params: any) {
  return MOCK_USER;
}

export async function findPostsPaged(
  limit: number,
  offset: number,
): Promise<DbPost[]> {
  // 게시글이 여러 개 있는 것처럼 보이게 복제해서 반환
  return [
    MOCK_POST,
    { ...MOCK_POST, id: 2, title: "두 번째 임시 게시글" },
    { ...MOCK_POST, id: 3, title: "세 번째 임시 게시글" },
  ];
}

export async function findPostById(id: number) {
  return { ...MOCK_POST, id }; // 요청한 ID를 가진 게시글 반환
}

export async function findPostsByKeywordPaged(
  keyword: string,
  limit: number,
  offset: number,
) {
  return [{ ...MOCK_POST, title: `'${keyword}' 검색 결과 임시 게시글` }];
}

export async function findUserContributions(userId: number) {
  return [
    { date: "2026-03-10", count: 5 }, // 최근 날짜로 임시 잔디(기여도) 데이터 생성
  ];
}

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
) {
  return [{ ...MOCK_POST, title: `'${keyword}' 검색 결과 임시 게시글` }];
}
