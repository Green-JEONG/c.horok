import type { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");

export const pool = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 10,
});

export type DbUser = {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  provider: "credentials" | "github" | "google";
  github_id: string | null; // OAuth 공용 ID로 사용
};

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return (rows[0] as DbUser | undefined) ?? null;
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name?: string | null;
  role?: "USER" | "ADMIN";
}) {
  const { email, passwordHash, name = null, role = "USER" } = params;

  await pool.query(
    "INSERT INTO users (email, password, name, role, provider) VALUES (?, ?, ?, ?, 'credentials')",
    [email, passwordHash, name, role],
  );

  return findUserByEmail(email);
}

export async function deleteUserById(userId: string) {
  await pool.query("DELETE FROM users WHERE id = ?", [userId]);
}

export async function upsertOAuthUser(params: {
  email: string;
  name?: string | null;
  provider: "github" | "google";
  providerId: string;
}) {
  const { email, name = null, provider, providerId } = params;

  const role = email === "th2gr22n@gmail.com" ? "ADMIN" : "USER";

  await pool.query(
    `
    INSERT INTO users (email, name, role, provider, github_id)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = COALESCE(VALUES(name), name),
      provider = VALUES(provider),
      github_id = COALESCE(github_id, VALUES(github_id))
    `,
    [email, name, role, provider, providerId],
  );

  return findUserByEmail(email);
}

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

export async function findPostsPaged(
  limit: number,
  offset: number,
): Promise<DbPost[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.thumbnail,
      p.created_at,
      u.name AS author_name,
      c.name AS category_name,
      0 AS likes_count,
      0 AS comments_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [limit, offset],
  );

  return rows as DbPost[];
}

export async function findPostById(id: number) {
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.thumbnail,
      p.created_at,
      u.name AS author_name,
      c.name AS category_name
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
    LIMIT 1
    `,
    [id],
  );

  return (rows as DbPost[])[0] ?? null;
}

export async function findPostsByKeywordPaged(
  keyword: string,
  limit: number,
  offset: number,
) {
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.thumbnail,
      p.created_at,
      u.name AS author_name,
      c.name AS category_name,
      0 AS likes_count,
      0 AS comments_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    WHERE
      p.title LIKE ? OR
      p.content LIKE ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [`%${keyword}%`, `%${keyword}%`, limit, offset],
  );

  return rows as DbPost[];
}

export type DbContribution = {
  date: string; // YYYY-MM-DD
  count: number;
};

export async function findUserContributions(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
      COUNT(*) AS count
    FROM posts
    WHERE user_id = ?
      AND is_deleted = 0
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date
    `,
    [userId],
  );

  return rows as { date: string; count: number }[];
}

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.thumbnail,
      p.created_at,
      u.name AS author_name,
      c.name AS category_name,
      0 AS likes_count,
      0 AS comments_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    WHERE MATCH(p.title, p.content) AGAINST (? IN BOOLEAN MODE)
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [`${keyword}*`, limit, offset],
  );

  return rows;
}
