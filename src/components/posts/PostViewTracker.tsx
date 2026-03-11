"use client";

import { useEffect } from "react";

type Props = {
  postId: number;
};

export default function PostViewTracker({ postId }: Props) {
  useEffect(() => {
    void fetch(`/api/posts/${postId}/view`, {
      method: "POST",
    });
  }, [postId]);

  return null;
}
