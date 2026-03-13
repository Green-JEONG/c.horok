"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Comment = {
  id: number;
  content: string;
  created_at: string;
  author: string;
};

export default function CommentItem({
  comment,
  canManage,
}: {
  comment: Comment;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="rounded-md border p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{comment.author}</span>
        <span className="text-muted-foreground">
          {new Date(comment.created_at).toLocaleString("ko-KR")}
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
        <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
      )}

      {canManage ? (
        <div className="mt-3 flex justify-end gap-2 text-xs text-muted-foreground">
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
        </div>
      ) : null}

      {!isEditing && error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
