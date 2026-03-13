"use client";

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
      className="text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      👍 좋아요 {count}
    </button>
  );
}
