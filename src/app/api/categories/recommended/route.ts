import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      c.id,
      c.name,
      COUNT(p.id) AS postCount
    FROM categories c
    LEFT JOIN posts p
      ON p.category_id = c.id
      AND p.is_deleted = 0
    GROUP BY c.id, c.name
    ORDER BY postCount DESC
    LIMIT 10
    `,
  );

  return NextResponse.json(rows);
}
