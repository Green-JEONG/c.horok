import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDbUserIdFromSession } from "@/lib/auth-db";
import { deletePost, getPostById, updatePost } from "@/lib/posts";

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

  const dbUserId = await getDbUserIdFromSession();
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

  const { title, content, categoryName, thumbnailUrl } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const updated = await updatePost({
    postId,
    title,
    content,
    categoryName,
    thumbnailUrl:
      typeof thumbnailUrl === "string"
        ? thumbnailUrl.trim() || null
        : thumbnailUrl === null
          ? null
          : undefined,
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

  const dbUserId = await getDbUserIdFromSession();
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
