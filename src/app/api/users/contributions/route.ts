import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findUserContributions } from "@/lib/db";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json([], { status: 200 });
    }

    // email → users.id(BIGINT) 변환
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [session.user.email],
    );

    if (rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const userId = rows[0].id as number;

    const data = await findUserContributions(userId);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[contributions API error]", err);
    return NextResponse.json([], { status: 200 });
  }
}
