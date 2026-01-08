import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createPost } from "@/lib/posts";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      p.created_at,
      c.name AS category,
      u.email AS author
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    `,
  );

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // DB용 userId 조회 (핵심)
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  if (users.length === 0) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const userId = users[0].id as number;

  const body = await req.json();
  const { categoryId, title, content } = body;

  if (!categoryId || !title || !content) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const post = await createPost({
    userId,
    categoryId,
    title,
    content,
  });

  return NextResponse.json(post, { status: 201 });
}
