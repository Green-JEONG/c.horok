"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import { getTechFeedPostPath } from "@/lib/routes";

const PAGE_SIZE = 5;

type MyComment = {
  id: number;
  content: string;
  post_id: number;
  post_title: string;
  is_post_deleted: boolean;
};

export default function MyCommentsSection() {
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(comments.length / PAGE_SIZE));
  const pagedComments = comments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <section className="space-y-4">
      <h2 className="mb-4 text-xl font-semibold">내가 쓴 댓글</h2>

      <ul className="space-y-3">
        {pagedComments.map(
          ({ id, content, post_id, post_title, is_post_deleted }) => (
            <li key={id}>
              {is_post_deleted ? (
                <div className="block rounded-lg border p-4 text-sm opacity-70">
                  <p className="line-clamp-2">{content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post_title}
                  </p>
                </div>
              ) : (
                <Link
                  href={`${getTechFeedPostPath(post_id)}?commentId=${id}`}
                  className="block rounded-lg border p-4 text-sm transition-colors hover:bg-muted"
                >
                  <p className="line-clamp-2">{content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post_title}에 달린 댓글
                  </p>
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      <SectionPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </section>
  );
}
