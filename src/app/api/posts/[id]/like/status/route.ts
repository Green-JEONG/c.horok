import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { hasLiked, getLikeCount } from "@/lib/likes";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const session = await auth();

  let liked = false;

  if (session?.user?.email) {
    // 🔑 email → DB userId(BIGINT)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [session.user.email],
    );

    if (rows.length > 0) {
      const userId = rows[0].id as number;
      liked = await hasLiked(postId, userId);
    }
  }

  const likeCount = await getLikeCount(postId);

  return NextResponse.json({
    liked,
    likeCount,
  });
}
