import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("NO SESSION");
      return NextResponse.json([]);
    }

    const userId = session.user.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.image
      FROM friends f
      JOIN users u ON u.id = f.friend_user_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      `,
      [userId],
    );

    console.log("FRIENDS ROWS:", rows);

    return NextResponse.json(rows);
  } catch (e) {
    console.error("FRIENDS API ERROR:", e);
    return NextResponse.json([], { status: 500 });
  }
}
