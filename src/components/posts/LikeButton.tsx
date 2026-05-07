"use client";

import { Heart } from "lucide-react";
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
    if (loading || disabled) return;
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
      disabled={loading || disabled}
      aria-label={liked ? `좋아요 취소 ${count}` : `좋아요 ${count}`}
      className={`inline-flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
        liked
          ? "text-rose-500 hover:text-rose-600"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
