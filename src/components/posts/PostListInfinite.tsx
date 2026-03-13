"use client";

import { useEffect, useRef, useState } from "react";
import type { DbPost } from "@/lib/db";
import PostCard from "./PostCard";

const PAGE_SIZE = 12;

export default function PostListInfinite({
  initialPosts,
}: {
  initialPosts: DbPost[];
}) {
  const [posts, setPosts] = useState<DbPost[]>(initialPosts);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loading || !hasMore || fetchingRef.current)
          return;

        fetchingRef.current = true;
        setLoading(true);

        const res = await fetch(`/api/posts?page=${page}`);
        const data: DbPost[] = await res.json();

        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = data.filter((p) => !existingIds.has(p.id));

          if (newPosts.length < PAGE_SIZE) {
            setHasMore(false);
          }

          return [...prev, ...newPosts];
        });

        setPage((p) => p + 1);
        setLoading(false);
        fetchingRef.current = false;
      },
      { rootMargin: "300px" },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, loading, hasMore]);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            description={post.content}
            thumbnail={post.thumbnail}
            category={post.category_name}
            author={post.author_name}
            likes={post.likes_count}
            comments={post.comments_count}
            createdAt={post.created_at}
          />
        ))}
      </div>

      {hasMore && <div ref={loaderRef} className="h-16 w-full" />}

      {loading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          불러오는 중...
        </p>
      )}

      {!hasMore && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          마지막 게시글입니다
        </p>
      )}
    </>
  );
}
