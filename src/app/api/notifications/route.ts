import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";
import { requireDbUserId } from "@/lib/auth-db"; // ✅ 핵심

export async function GET() {
  try {
    // 숫자 user_id (users.id)
    const userId = await requireDbUserId();

    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        id,
        type,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [userId],
    );

    return NextResponse.json(rows);
  } catch (e) {
    console.error("🔔 NOTIFICATIONS API ERROR", e);
    return NextResponse.json([], { status: 500 });
  }
}
