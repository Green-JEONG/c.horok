"use client";

import { useEffect, useState } from "react";

type MyComment = {
  id: number;
  content: string;
  post_title: string;
};

export default function MyCommentsSection() {
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mypage/comments")
      .then((res) => res.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">작성한 댓글이 없습니다.</p>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">내가 쓴 댓글</h2>

      <ul className="space-y-3">
        {comments.map(({ id, content, post_title }) => (
          <li key={id} className="rounded-lg border p-4 text-sm hover:bg-muted">
            <p className="line-clamp-2">{content}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {post_title}에 달린 댓글
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
