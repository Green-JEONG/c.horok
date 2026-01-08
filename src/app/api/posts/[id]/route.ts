import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPostById, updatePost, deletePost } from "@/lib/posts";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

async function getDbUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [session.user.email],
  );

  return rows.length > 0 ? (rows[0].id as number) : null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserId();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = post.user_id === dbUserId;

  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { title, content } = await req.json();

  const updated = await updatePost({
    postId,
    title,
    content,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserId();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = post.user_id === dbUserId;

  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await deletePost(postId);

  return NextResponse.json({ ok: true });
}
