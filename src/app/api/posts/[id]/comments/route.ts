import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDbUserIdFromSession } from "@/lib/auth-db";
import {
  getCommentById,
  softDeleteComment,
  updateComment,
  updateCommentHidden,
} from "@/lib/comments";

/**
 * 댓글 수정 (작성자만 가능)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentId = Number(id);

  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { message: "Invalid comment id" },
      { status: 400 },
    );
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const comment = await getCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = comment.user_id === dbUserId;
  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { content, isSecret } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ message: "Content required" }, { status: 400 });
  }

  const updated = await updateComment({
    commentId,
    content,
    isSecret: typeof isSecret === "boolean" ? isSecret : undefined,
  });

  return NextResponse.json(updated);
}

/**
 * 댓글 삭제 (작성자만 가능)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentId = Number(id);

  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { message: "Invalid comment id" },
      { status: 400 },
    );
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const comment = await getCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = comment.user_id === dbUserId;

  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await softDeleteComment(commentId);

  return NextResponse.json({ ok: true });
}

/**
 * 댓글 숨김 상태 변경 (작성자만 가능)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentId = Number(id);

  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { message: "Invalid comment id" },
      { status: 400 },
    );
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const comment = await getCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isOwner = comment.user_id === dbUserId;
  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { isHidden } = await req.json();
  if (typeof isHidden !== "boolean") {
    return NextResponse.json({ message: "isHidden required" }, { status: 400 });
  }

  const updated = await updateCommentHidden({
    commentId,
    isHidden,
  });

  return NextResponse.json(updated);
}
