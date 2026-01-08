import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db";

export type DbPost = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
};

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
): Promise<DbPost[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.created_at,
      u.name AS author_name,
      c.name AS category_name,
      0 AS likes_count,
      0 AS comments_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    WHERE
      MATCH(p.title, p.content)
      AGAINST (? IN BOOLEAN MODE)
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [`${keyword}*`, limit, offset],
  );

  return rows as DbPost[];
}

export async function getMyPosts(userId: number): Promise<DbPost[]> {
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
      (
        SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id
      ) AS likes_count,
      (
        SELECT COUNT(*) FROM comments cm
        WHERE cm.post_id = p.id AND cm.is_deleted = 0
      ) AS comments_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = p.category_id
    WHERE p.user_id = ?
      AND p.is_deleted = 0
    ORDER BY p.created_at DESC
    `,
    [userId],
  );

  return rows as DbPost[];
}
