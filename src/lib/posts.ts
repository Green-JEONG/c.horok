import type mysql from "mysql2/promise";
import { pool } from "@/lib/db";

export type PostRow = {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

let postViewsTableReady: Promise<void> | null = null;

async function ensurePostViewsTable() {
  if (!postViewsTableReady) {
    postViewsTableReady = pool
      .query(
        `
        CREATE TABLE IF NOT EXISTS post_views (
          post_id BIGINT UNSIGNED NOT NULL,
          view_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (post_id),
          CONSTRAINT fk_post_views_post
            FOREIGN KEY (post_id) REFERENCES posts(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `,
      )
      .then(() => undefined);
  }

  await postViewsTableReady;
}

export async function getPostById(id: number) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM posts WHERE id = ?",
    [id],
  );
  return (rows[0] as PostRow | undefined) ?? null;
}

export type PopularPostRow = {
  id: number;
  title: string;
  viewCount: number;
};

export async function incrementPostViews(postId: number) {
  await ensurePostViewsTable();

  await pool.query(
    `
    INSERT INTO post_views (post_id, view_count)
    VALUES (?, 1)
    ON DUPLICATE KEY UPDATE view_count = view_count + 1
    `,
    [postId],
  );
}

export async function getPopularPosts(limit = 5): Promise<PopularPostRow[]> {
  await ensurePostViewsTable();

  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      COALESCE(pv.view_count, 0) AS viewCount
    FROM posts p
    LEFT JOIN post_views pv ON pv.post_id = p.id
    WHERE p.is_deleted = 0
    ORDER BY viewCount DESC, p.created_at DESC
    LIMIT ?
    `,
    [limit],
  );

  return rows as PopularPostRow[];
}

export async function createPost(params: {
  userId: number;
  categoryId: number;
  title: string;
  content: string;
}) {
  const { userId, categoryId, title, content } = params;

  const [result] = await pool.query<mysql.ResultSetHeader>(
    `INSERT INTO posts (user_id, category_id, title, content) VALUES (?, ?, ?, ?)`,
    [userId, categoryId, title, content],
  );

  return getPostById(result.insertId);
}

export async function updatePost(params: {
  postId: number;
  title: string;
  content: string;
}) {
  const { postId, title, content } = params;

  await pool.query(
    `UPDATE posts
     SET title = ?, content = ?
     WHERE id = ?`,
    [title, content, postId],
  );

  return getPostById(postId);
}

export async function deletePost(postId: number) {
  await pool.query("DELETE FROM posts WHERE id = ?", [postId]);
}
