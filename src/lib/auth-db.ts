import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export async function requireDbUserId(): Promise<number> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthenticated");
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  return rows[0].id as number;
}

export async function getDbUserIdFromSession() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  return rows.length ? rows[0].id : null;
}
