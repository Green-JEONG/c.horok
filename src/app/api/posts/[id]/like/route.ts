import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { toggleLike } from "@/lib/likes";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 🔑 email → DB userId(BIGINT)
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const userId = rows[0].id as number;

  const result = await toggleLike({ postId, userId });

  return NextResponse.json(result);
}
