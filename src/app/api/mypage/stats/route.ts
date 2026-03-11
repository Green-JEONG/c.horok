import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";

type TableRow = RowDataPacket & {
  TABLE_NAME: string;
};

type CountRow = RowDataPacket & {
  count: number;
};

async function getExistingTables(tableNames: string[]) {
  if (tableNames.length === 0) return new Set<string>();

  const placeholders = tableNames.map(() => "?").join(", ");
  const [rows] = await pool.query<TableRow[]>(
    `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (${placeholders})
    `,
    tableNames,
  );

  return new Set(rows.map((row) => row.TABLE_NAME));
}

async function getCountIfTableExists(
  existingTables: Set<string>,
  tableName: string,
  sql: string,
  params: Array<number | string>,
) {
  if (!existingTables.has(tableName)) return 0;

  const [rows] = await pool.query<CountRow[]>(sql, params);
  return Number(rows[0]?.count ?? 0);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ posts: 0, comments: 0, friends: 0 });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [session.user.email],
    );

    if (users.length === 0) {
      return NextResponse.json({ posts: 0, comments: 0, friends: 0 });
    }

    const userId = users[0].id as number;
    const existingTables = await getExistingTables([
      "posts",
      "comments",
      "friends",
    ]);

    const [posts, comments, friends] = await Promise.all([
      getCountIfTableExists(
        existingTables,
        "posts",
        `SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND is_deleted = 0`,
        [userId],
      ),
      getCountIfTableExists(
        existingTables,
        "comments",
        `SELECT COUNT(*) AS count FROM comments WHERE user_id = ? AND is_deleted = 0`,
        [userId],
      ),
      getCountIfTableExists(
        existingTables,
        "friends",
        `SELECT COUNT(*) AS count FROM friends WHERE user_id = ?`,
        [userId],
      ),
    ]);

    return NextResponse.json({ posts, comments, friends });
  } catch (e) {
    console.error("MYPAGE STATS API ERROR:", e);
    return NextResponse.json({ posts: 0, comments: 0, friends: 0 });
  }
}
