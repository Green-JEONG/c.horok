"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import {
  getTechFaqPath,
  getTechFeedPostPath,
  getTechNoticePath,
} from "@/lib/routes";
import { formatSeoulDate } from "@/lib/utils";

const PAGE_SIZE = 5;

type MyComment = {
  id: number;
  content: string;
  created_at: string;
  post_id: number;
  post_title: string;
  is_post_deleted: boolean;
  is_notice_post: boolean;
  notice_category_name?: string | null;
};

export default function MyCommentsSection() {
  const searchParams = useSearchParams();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    number | null
  >(null);
  const targetCommentId = useMemo(() => {
    const value = Number(searchParams.get("commentId") ?? "");
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);
  const targetPostId = useMemo(() => {
    const value = Number(searchParams.get("postId") ?? "");
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/mypage/comments")
      .then((res) => res.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(comments.length / PAGE_SIZE));
  const pagedComments = comments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    if (comments.length === 0) {
      return;
    }

    const targetIndex =
      typeof targetCommentId === "number"
        ? comments.findIndex((comment) => comment.id === targetCommentId)
        : typeof targetPostId === "number"
          ? comments.findIndex((comment) => comment.post_id === targetPostId)
          : -1;

    if (targetIndex < 0) {
      return;
    }

    const nextPage = Math.floor(targetIndex / PAGE_SIZE) + 1;
    const nextCommentId = comments[targetIndex]?.id ?? null;

    if (nextPage !== page) {
      setPage(nextPage);
    }

    setHighlightedCommentId(nextCommentId);
  }, [comments, page, targetCommentId, targetPostId]);

  useEffect(() => {
    if (typeof highlightedCommentId !== "number") {
      return;
    }

    const visible = pagedComments.some(
      (comment) => comment.id === highlightedCommentId,
    );
    if (!visible) {
      return;
    }

    const scrollTimeout = window.setTimeout(() => {
      const element = document.getElementById(
        `mypage-comment-${highlightedCommentId}`,
      );
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const highlightTimeout = window.setTimeout(() => {
      setHighlightedCommentId((current) =>
        current === highlightedCommentId ? null : current,
      );
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [highlightedCommentId, pagedComments]);

  if (loading)
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">내가 쓴 댓글</h2>
          <span className="text-sm font-medium text-muted-foreground">0</span>
        </div>
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </section>
    );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">내가 쓴 댓글</h2>
        <span className="text-sm font-medium text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">작성한 댓글이 없습니다.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {pagedComments.map(
              ({
                id,
                content,
                created_at,
                post_id,
                post_title,
                is_post_deleted,
                is_notice_post,
                notice_category_name,
              }) => (
                <li
                  key={id}
                  id={`mypage-comment-${id}`}
                  className="scroll-mt-28 rounded-lg transition-colors"
                >
                  {is_post_deleted ? (
                    <div
                      className={`block rounded-lg border p-4 text-sm opacity-70 ${
                        highlightedCommentId === id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <p className="line-clamp-2 text-sm text-foreground">
                          {content}
                        </p>
                        <p className="shrink-0">
                          {formatSeoulDate(created_at)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {post_title}
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const postHref =
                        is_notice_post && notice_category_name === "FAQ"
                          ? `${getTechFaqPath(post_id)}&commentId=${id}`
                          : `${
                              is_notice_post
                                ? getTechNoticePath(post_id)
                                : getTechFeedPostPath(post_id)
                            }?commentId=${id}`;

                      return (
                        <Link
                          href={postHref}
                          className={`block rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted ${
                            highlightedCommentId === id
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <p className="line-clamp-2 text-sm text-foreground">
                              {content}
                            </p>
                            <p className="shrink-0">
                              {formatSeoulDate(created_at)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {post_title}에 달린 댓글
                          </p>
                        </Link>
                      );
                    })()
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
        </>
      )}
    </section>
  );
}
