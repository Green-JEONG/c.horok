"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseSortType, type SortType } from "@/lib/post-sort";
import PostCard from "./PostCard";

const PAGE_SIZE = 12;

type PostListItem = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date | string;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
};

type Props = {
  initialPosts: PostListItem[];
  endpoint: string;
  initialSort?: SortType;
  responseKey?: string;
  gridClassName?: string;
  emptyMessage?: string;
  endMessage?: string;
  loadingMessage?: string;
  syncSortWithSearchParams?: boolean;
  autoloadFirstPage?: boolean;
};

function readPostsFromPayload(
  payload: unknown,
  responseKey?: string,
): PostListItem[] {
  if (Array.isArray(payload)) {
    return payload as PostListItem[];
  }

  if (
    responseKey &&
    payload &&
    typeof payload === "object" &&
    responseKey in payload
  ) {
    const value = payload[responseKey as keyof typeof payload];
    return Array.isArray(value) ? (value as PostListItem[]) : [];
  }

  return [];
}

export default function PostListInfinite({
  initialPosts,
  endpoint,
  initialSort = "latest",
  responseKey,
  gridClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
  emptyMessage = "게시물이 없습니다.",
  endMessage = "마지막 게시물입니다",
  loadingMessage = "불러오는 중...",
  syncSortWithSearchParams = false,
  autoloadFirstPage = false,
}: Props) {
  const searchParams = useSearchParams();
  const sort = syncSortWithSearchParams
    ? parseSortType(searchParams.get("sort") ?? initialSort)
    : initialSort;

  const [posts, setPosts] = useState<PostListItem[]>(initialPosts);
  const [page, setPage] = useState(initialPosts.length > 0 ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!autoloadFirstPage);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    setPosts(initialPosts);
    setPage(initialPosts.length > 0 ? 2 : 1);
    setHasMore(initialPosts.length >= PAGE_SIZE || autoloadFirstPage);
    setHasLoadedOnce(!autoloadFirstPage || initialPosts.length > 0);
    fetchingRef.current = false;
  }, [autoloadFirstPage, initialPosts]);

  useEffect(() => {
    const loadMore = async () => {
      if (loading || !hasMore || fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading(true);

      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("page", String(page));

        if (syncSortWithSearchParams) {
          url.searchParams.set("sort", sort);
        }

        const res = await fetch(url.toString());
        const data = readPostsFromPayload(await res.json(), responseKey);

        setPosts((prev) => {
          const existingIds = new Set(prev.map((post) => post.id));
          const newPosts = data.filter((post) => !existingIds.has(post.id));

          if (newPosts.length < PAGE_SIZE) {
            setHasMore(false);
          }

          return [...prev, ...newPosts];
        });

        setPage((current) => current + 1);
        setHasLoadedOnce(true);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    if (autoloadFirstPage && !hasLoadedOnce && posts.length === 0) {
      void loadMore();
      return;
    }

    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        void loadMore();
      },
      { rootMargin: "300px" },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [
    autoloadFirstPage,
    endpoint,
    hasLoadedOnce,
    hasMore,
    loading,
    page,
    posts.length,
    responseKey,
    sort,
    syncSortWithSearchParams,
  ]);

  if (!loading && posts.length === 0 && !hasMore && hasLoadedOnce) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      {posts.length > 0 && (
        <div className={gridClassName}>
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
              createdAt={new Date(post.created_at)}
            />
          ))}
        </div>
      )}

      {hasMore && <div ref={loaderRef} className="h-16 w-full" />}

      {loading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {loadingMessage}
        </p>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {endMessage}
        </p>
      )}
    </>
  );
}
