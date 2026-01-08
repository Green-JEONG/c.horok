import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json([]);
  }

  // email → userId
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  if (users.length === 0) {
    return NextResponse.json([]);
  }

  const userId = users[0].id;

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      c.id,
      c.content,
      p.title AS post_title
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    WHERE c.user_id = ?
      AND c.is_deleted = 0
    ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return NextResponse.json(rows);
}
