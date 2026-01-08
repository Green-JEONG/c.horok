import { NextResponse } from "next/server";
import { createComment, getCommentById } from "@/lib/comments";
import { getPostById } from "@/lib/posts";
import { pool } from "@/lib/db";
import { requireDbUserId } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    const userId = await requireDbUserId();

    const body = await req.json();
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // 1) 댓글 생성
    const commentId = await createComment({
      postId: Number(postId),
      userId, // number로 일치
      content,
      parentId: parentId ? Number(parentId) : null,
    });

    // 2) 알림 생성 (실패해도 댓글은 성공)
    try {
      if (parentId) {
        // 대댓글 → 부모 댓글 작성자에게
        const parentComment = await getCommentById(Number(parentId));

        if (parentComment && parentComment.user_id !== userId) {
          await pool.query(
            `
            INSERT INTO notifications
              (user_id, actor_id, type, message, post_id, comment_id)
            VALUES
              (?, ?, 'COMMENT_REPLY', ?, ?, ?)
            `,
            [
              parentComment.user_id, // number
              userId, // number
              "내 댓글에 답글이 달렸어요",
              Number(postId),
              commentId,
            ],
          );
        }
      } else {
        // 새 댓글 → 게시글 작성자에게
        const post = await getPostById(Number(postId));

        // post.user_id도 number여야 함
        if (post && post.user_id !== userId) {
          await pool.query(
            `
            INSERT INTO notifications
              (user_id, actor_id, type, message, post_id, comment_id)
            VALUES
              (?, ?, 'NEW_COMMENT', ?, ?, ?)
            `,
            [
              post.user_id, // number
              userId, // number
              "내 게시물에 새로운 댓글이 달렸어요",
              Number(postId),
              commentId,
            ],
          );
        }
      }
    } catch (e) {
      console.error("🔔 알림 생성 실패", e);
    }

    return NextResponse.json({ id: commentId }, { status: 201 });
  } catch (e) {
    console.error("❌ 댓글 API 실패", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
