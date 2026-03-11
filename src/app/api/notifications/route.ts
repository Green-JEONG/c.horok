import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";

type NotificationColumnRow = RowDataPacket & {
  COLUMN_NAME: string;
};

type NotificationRow = RowDataPacket & {
  id: number;
  type: string | null;
  message?: string | null;
  actor_name?: string | null;
  post_id?: number | null;
  comment_id?: number | null;
  is_read: number | boolean | null;
  created_at: string;
};

function normalizeNotificationType(type: string | null) {
  if (type === "NEW_COMMENT") return "POST_COMMENT";
  return type ?? "UNKNOWN";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json([], { status: 401 });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [session.user.email],
    );

    if (users.length === 0) {
      return NextResponse.json([], { status: 404 });
    }

    const userId = users[0].id as number;

    const [columns] = await pool.query<NotificationColumnRow[]>(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notifications'
      `,
    );

    if (columns.length === 0) {
      return NextResponse.json([]);
    }

    const columnSet = new Set(columns.map((column) => column.COLUMN_NAME));
    const hasActorId = columnSet.has("actor_id");
    const hasMessage = columnSet.has("message");
    const hasPostId = columnSet.has("post_id");
    const hasCommentId = columnSet.has("comment_id");

    const selectFields = [
      "n.id",
      "n.type",
      hasMessage ? "n.message" : "NULL AS message",
      hasActorId ? "actor.name AS actor_name" : "NULL AS actor_name",
      hasPostId ? "n.post_id" : "NULL AS post_id",
      hasCommentId ? "n.comment_id" : "NULL AS comment_id",
      "n.is_read",
      "n.created_at",
    ];

    const joinClause = hasActorId
      ? "LEFT JOIN users actor ON actor.id = n.actor_id"
      : "";

    const [rows] = await pool.query<NotificationRow[]>(
      `
      SELECT
        ${selectFields.join(",\n        ")}
      FROM notifications n
      ${joinClause}
      WHERE n.user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [userId],
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        type: normalizeNotificationType(row.type),
        message: row.message ?? null,
        actor_name: row.actor_name ?? null,
        post_id: row.post_id ?? null,
        comment_id: row.comment_id ?? null,
        is_read: Number(row.is_read ?? 0),
        created_at: row.created_at,
      })),
    );
  } catch (e) {
    console.error("🔔 NOTIFICATIONS API ERROR", e);
    return NextResponse.json([], { status: 500 });
  }
}
