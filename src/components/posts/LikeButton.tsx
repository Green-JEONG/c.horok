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
      className={`inline-flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
        liked
          ? "text-orange-500 hover:text-orange-600"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
