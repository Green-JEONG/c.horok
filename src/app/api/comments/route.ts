import { NextResponse } from "next/server";
import { requireDbUserId } from "@/lib/auth-db";
import { createComment, getCommentById } from "@/lib/comments";
import { getPostById } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await requireDbUserId();

    const body = await req.json();
    const { postId, content, parentId, isSecret } = body;

    if (!postId || !content) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const post = await getPostById(Number(postId), {
      includeHiddenForUserId: userId,
    });
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    if (post.is_secret && !post.can_view_secret) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (parentId) {
      const parentComment = await getCommentById(Number(parentId));

      if (!parentComment) {
        return NextResponse.json(
          { message: "Parent comment not found" },
          { status: 404 },
        );
      }

      if (parentComment.parent_id !== null) {
        return NextResponse.json(
          { message: "Reply depth cannot exceed 1" },
          { status: 400 },
        );
      }
    }

    // 1) 댓글 생성
    const commentId = await createComment({
      postId: Number(postId),
      userId, // number로 일치
      content,
      parentId: parentId ? Number(parentId) : null,
      isSecret: Boolean(isSecret),
    });

    // 2) 알림 생성 (실패해도 댓글은 성공)
    try {
      if (parentId) {
        // 대댓글 → 부모 댓글 작성자에게
        const parentComment = await getCommentById(Number(parentId));

        if (parentComment && parentComment.user_id !== userId) {
          await prisma.notification.create({
            data: {
              userId: BigInt(parentComment.user_id),
              actorId: BigInt(userId),
              type: "COMMENT_REPLY",
              content: "내 댓글에 답글이 달렸어요",
              postId: BigInt(Number(postId)),
              commentId: BigInt(commentId),
            },
          });
        }
      } else {
        // 새 댓글 → 게시글 작성자에게
        // post.user_id도 number여야 함
        if (post && post.user_id !== userId) {
          await prisma.notification.create({
            data: {
              userId: BigInt(post.user_id),
              actorId: BigInt(userId),
              type: "NEW_COMMENT",
              content: "내 게시물에 새로운 댓글이 달렸어요",
              postId: BigInt(Number(postId)),
              commentId: BigInt(commentId),
            },
          });
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
