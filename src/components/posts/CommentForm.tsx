"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CommentForm({
  postId,
  parentId = null,
  placeholder = "댓글을 작성하세요",
  initialIsSecret = false,
}: {
  postId: number;
  parentId?: number | null;
  placeholder?: string;
  initialIsSecret?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(initialIsSecret);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: trimmedContent,
          parentId,
          isSecret,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "댓글 등록에 실패했습니다.");
        return;
      }

      setContent("");
      setIsSecret(initialIsSecret);
      router.refresh();
    } catch {
      setError("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-2" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="w-full rounded-md border p-3 text-sm"
        rows={3}
        placeholder={placeholder}
      />

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={isSecret}
            onChange={(event) => setIsSecret(event.target.checked)}
            className="h-4 w-4"
          />
          <span>비밀댓글</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "등록 중..." : "등록"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </form>
  );
}
