import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ posts: 0, comments: 0, friends: 0 });
  }

  // email → userId
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  if (users.length === 0) {
    return NextResponse.json({ posts: 0, comments: 0, friends: 0 });
  }

  const userId = users[0].id as number;

  /** 글 수 */
  const [[postRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND is_deleted = 0`,
    [userId],
  );

  /** 댓글 수 */
  const [[commentRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM comments WHERE user_id = ? AND is_deleted = 0`,
    [userId],
  );

  /** 친구 수 */
  const [[friendRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM friends WHERE user_id = ?`,
    [userId],
  );

  return NextResponse.json({
    posts: postRow.count,
    comments: commentRow.count,
    friends: friendRow.count,
  });
}
