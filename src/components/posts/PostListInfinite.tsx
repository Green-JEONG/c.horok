"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { isNoticeCategoryName } from "@/lib/notice-categories";
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
  author_image?: string | null;
  category_name: string;
  likes_count: number;
  comments_count: number;
  is_hidden?: boolean;
  is_secret?: boolean;
  can_view_secret?: boolean;
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
  postRouteSection?: "feeds" | "likes";
  groupBySearchCategory?: boolean;
  searchGroupTitleAction?: ReactNode;
  faqSearchGroupTitleAction?: ReactNode;
};

const SEARCH_RESULT_GROUPS = [
  {
    label: "게시물",
    matches: (post: PostListItem) => !isNoticeCategoryName(post.category_name),
  },
  {
    label: "공지",
    matches: (post: PostListItem) => post.category_name === "공지",
  },
  {
    label: "FAQ",
    matches: (post: PostListItem) => post.category_name === "FAQ",
  },
  {
    label: "QnA",
    matches: (post: PostListItem) => post.category_name === "QnA",
  },
] as const;

const SEARCH_SORTABLE_GROUPS = new Set(["게시물", "공지", "QnA"]);

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
  postRouteSection = "feeds",
  groupBySearchCategory = false,
  searchGroupTitleAction,
  faqSearchGroupTitleAction,
}: Props) {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
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

        if (syncSortWithSearchParams) {
          const currentParams = new URLSearchParams(searchParamsString);

          for (const [key, value] of currentParams.entries()) {
            url.searchParams.set(key, value);
          }
          url.searchParams.set("sort", sort);
        }

        url.searchParams.set("page", String(page));

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
    searchParamsString,
    sort,
    syncSortWithSearchParams,
  ]);

  if (!loading && posts.length === 0 && !hasMore && hasLoadedOnce) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const groupedPosts = groupBySearchCategory
    ? SEARCH_RESULT_GROUPS.map((group) => ({
        label: group.label,
        posts: posts.filter(group.matches),
      })).filter((group) => group.posts.length > 0)
    : [];

  const renderPostCard = (post: PostListItem) => (
    <PostCard
      key={post.id}
      id={post.id}
      title={post.title}
      description={post.content}
      thumbnail={post.thumbnail}
      category={post.category_name}
      author={post.author_name}
      authorImage={post.author_image}
      likes={post.likes_count}
      comments={post.comments_count}
      createdAt={new Date(post.created_at)}
      isHidden={post.is_hidden}
      isSecret={post.is_secret}
      canViewSecret={post.can_view_secret}
      postRouteSection={postRouteSection}
    />
  );

  return (
    <>
      {groupBySearchCategory && groupedPosts.length > 0 ? (
        <div className="space-y-8">
          {groupedPosts.map((group) => (
            <section key={group.label} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{group.label}</h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {group.posts.length}
                  </span>
                </div>
                {group.label === "FAQ"
                  ? faqSearchGroupTitleAction
                  : SEARCH_SORTABLE_GROUPS.has(group.label)
                    ? searchGroupTitleAction
                    : null}
              </div>
              <div className={gridClassName}>
                {group.posts.map((post) => renderPostCard(post))}
              </div>
            </section>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className={gridClassName}>
          {posts.map((post) => renderPostCard(post))}
        </div>
      ) : null}

      {hasMore && <div ref={loaderRef} className="h-16 w-full" />}

      {loading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {loadingMessage}
        </p>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="py-6 text-center text-lg font-bold tracking-tight text-muted-foreground">
          {endMessage}
        </p>
      )}
    </>
  );
}
