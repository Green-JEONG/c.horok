"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

type Props = {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  disabled?: boolean;
};

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  disabled = false,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const onToggle = async () => {
    if (loading) return;

    if (disabled) {
      window.alert("로그인 후 이용 가능합니다.");
      return;
    }

    setLoading(true);

    setLiked((v) => !v);
    setCount((c) => c + (liked ? -1 : 1));

    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });

    // 실패하면 롤백
    if (!res.ok) {
      setLiked(initialLiked);
      setCount(initialCount);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      aria-disabled={disabled}
      aria-label={liked ? `북마크 취소 ${count}` : `북마크 ${count}`}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        liked
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
      }`}
    >
      <Bookmark
        className={`h-3.5 w-3.5 ${liked ? "fill-current text-orange-500" : ""}`}
      />
      <span className="font-semibold">{count}</span>
    </button>
  );
}
