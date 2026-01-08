import type mysql from "mysql2/promise";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

/**
 * 사용자가 이미 좋아요를 눌렀는지 확인
 */
export async function hasLiked(postId: number, userId: number) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `
    SELECT 1
    FROM post_likes
    WHERE post_id = ? AND user_id = ?
    LIMIT 1
    `,
    [postId, userId],
  );

  return rows.length > 0;
}

/**
 * 좋아요 추가
 */
export async function addLike(postId: number, userId: number) {
  await pool.query(
    `
    INSERT INTO post_likes (post_id, user_id)
    VALUES (?, ?)
    `,
    [postId, userId],
  );
}

/**
 * 좋아요 제거
 */
export async function removeLike(postId: number, userId: number) {
  await pool.query(
    `
    DELETE FROM post_likes
    WHERE post_id = ? AND user_id = ?
    `,
    [postId, userId],
  );
}

/**
 * 게시글 좋아요 수 조회
 */
export async function getLikeCount(postId: number) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `
    SELECT COUNT(*) AS count
    FROM post_likes
    WHERE post_id = ?
    `,
    [postId],
  );

  return Number(rows[0]?.count ?? 0);
}

export async function toggleLike({
  postId,
  userId,
}: {
  postId: number;
  userId: number;
}) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`,
    [postId, userId],
  );

  let liked: boolean;

  if (rows.length > 0) {
    await pool.query(
      `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, userId],
    );
    liked = false;
  } else {
    await pool.query(
      `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`,
      [postId, userId],
    );
    liked = true;
  }

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?`,
    [postId],
  );

  return {
    liked,
    likeCount: Number(countRows[0].count),
  };
}
