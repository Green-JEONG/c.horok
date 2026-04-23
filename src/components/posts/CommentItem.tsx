"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommentForm from "./CommentForm";

export type CommentNode = {
  id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_deleted: boolean;
  is_edited: boolean;
  created_at: string;
  author: string;
  replies: CommentNode[];
};

export default function CommentItem({
  comment,
  postId,
  currentUserId,
  isLoggedIn,
}: {
  comment: CommentNode;
  postId: number;
  currentUserId: number | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocusedComment, setIsFocusedComment] = useState(false);
  const canManage = comment.user_id === currentUserId && !comment.is_deleted;
  const canReply =
    isLoggedIn && comment.parent_id === null && !comment.is_deleted;
  const targetCommentId = Number(searchParams.get("commentId") ?? "");

  useEffect(() => {
    if (!Number.isFinite(targetCommentId) || targetCommentId !== comment.id) {
      return;
    }

    const element = document.getElementById(`comment-${comment.id}`);
    if (!element) {
      return;
    }

    setIsFocusedComment(true);

    const scrollTimeout = window.setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const highlightTimeout = window.setTimeout(() => {
      setIsFocusedComment(false);
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [comment.id, targetCommentId]);

  async function handleUpdate() {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${comment.id}/comments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmedContent }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "댓글 수정에 실패했습니다.");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("이 댓글을 삭제할까요?");
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${comment.id}/comments`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "댓글 삭제에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      id={`comment-${comment.id}`}
      className={`scroll-mt-28 rounded-md border p-4 transition-colors ${
        isFocusedComment ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex justify-between text-sm">
        <span className="font-medium">{comment.author}</span>
        <span className="text-muted-foreground">
          {new Date(comment.created_at).toLocaleString("ko-KR")}
          {comment.is_edited ? " (수정)" : ""}
        </span>
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            className="w-full rounded-md border p-3 text-sm"
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setContent(comment.content);
                setIsEditing(false);
                setError(null);
              }}
              className="rounded-md border px-3 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleUpdate}
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "저장 중..." : "수정 저장"}
            </button>
          </div>
        </div>
      ) : (
        <p
          className={`mt-2 whitespace-pre-wrap text-sm ${
            comment.is_deleted ? "text-muted-foreground" : ""
          }`}
        >
          {comment.is_deleted ? "삭제된 댓글입니다." : comment.content}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2 text-xs text-muted-foreground">
        {canReply ? (
          <button
            type="button"
            onClick={() => {
              setIsReplying((prev) => !prev);
              setError(null);
            }}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            {isReplying ? "답글 닫기" : "답글 달기"}
          </button>
        ) : null}

        {canManage ? (
          <>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setIsEditing((prev) => !prev);
                setError(null);
              }}
              className="rounded-md border px-3 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? "닫기" : "수정"}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-md border px-3 py-1.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </>
        ) : null}
      </div>

      {isReplying ? (
        <div className="ml-4 mt-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            placeholder="대댓글을 작성하세요"
          />
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <ul className="ml-4 mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem
                comment={reply}
                postId={postId}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!isEditing && error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
