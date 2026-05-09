"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import PostCard from "@/components/posts/PostCard";
import PostSortButton from "@/components/posts/PostSortButton";
import { getPostDraftStorageKey, loadPostDraft } from "@/lib/post-drafts";
import { getTechFeedNewPostPath } from "@/lib/routes";

const DEFAULT_PREVIEW_PAGE_SIZE = 4;

function getResponsivePageSize() {
  if (typeof window === "undefined") {
    return DEFAULT_PREVIEW_PAGE_SIZE;
  }

  if (window.innerWidth >= 1280) {
    return 10;
  }

  if (window.innerWidth >= 1024) {
    return 8;
  }

  if (window.innerWidth >= 640) {
    return 6;
  }

  return 4;
}

type MyPost = {
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
  is_hidden: boolean;
  is_secret: boolean;
};

type DraftPost = MyPost & {
  is_draft?: boolean;
  href_override?: string;
};

type MyPostsResponse = {
  posts: MyPost[];
  totalCount: number;
  resolvedPage?: number;
};

export default function MyPostsSection() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(DEFAULT_PREVIEW_PAGE_SIZE);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(
    null,
  );
  const targetPostId = useMemo(() => {
    const value = Number(searchParams.get("postId") ?? "");
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);
  const categorySlug = searchParams.get("category")?.trim() || null;
  const sort = searchParams.get("sort")?.trim() || null;
  const listKey = `${categorySlug ?? ""}:${sort ?? ""}`;
  const previousListKeyRef = useRef(listKey);

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize((current) => {
        const next = getResponsivePageSize();
        if (current !== next) {
          setPage(1);
        }
        return current === next ? current : next;
      });
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, []);

  useEffect(() => {
    if (previousListKeyRef.current === listKey) {
      return;
    }

    previousListKeyRef.current = listKey;
    setPage(1);
  }, [listKey]);

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (typeof targetPostId === "number") {
          params.set("targetPostId", String(targetPostId));
        }
        if (categorySlug) {
          params.set("category", categorySlug);
        }
        if (sort) {
          params.set("sort", sort);
        }
        const response = await fetch(`/api/mypage/posts?${params.toString()}`);
        const data: MyPostsResponse = await response.json();
        const nextPosts = Array.isArray(data.posts) ? data.posts : [];
        const draftStorageKey = getPostDraftStorageKey({
          successPathPrefix: "/horok-tech/feeds/posts",
          fixedTagOptions: [],
          categoryLocked: false,
        });
        const draft =
          status === "authenticated" && page === 1
            ? loadPostDraft(draftStorageKey)
            : null;
        const draftPost =
          draft && page === 1
            ? ({
                id: -1,
                title: draft.title.trim() || "임시저장된 글",
                content: draft.content.trim() || "임시 저장된 글입니다.",
                thumbnail: draft.thumbnailUrl ?? null,
                created_at: draft.savedAt,
                author_name: "나",
                category_name: "임시저장",
                likes_count: 0,
                comments_count: 0,
                is_hidden: false,
                is_secret: false,
                is_draft: true,
                href_override: getTechFeedNewPostPath(),
              } satisfies DraftPost)
            : null;
        const mergedPosts = draftPost
          ? [draftPost, ...nextPosts.slice(0, pageSize - 1)]
          : nextPosts;

        if (cancelled) return;

        if (
          typeof data.resolvedPage === "number" &&
          data.resolvedPage > 0 &&
          data.resolvedPage !== page
        ) {
          setPage(data.resolvedPage);
        }
        setPosts(mergedPosts);
        setTotalCount(
          typeof data.totalCount === "number" ? data.totalCount : 0,
        );
      } catch {
        if (cancelled) return;
        setPosts([]);
        setTotalCount(0);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, page, pageSize, sort, status, targetPostId]);

  useEffect(() => {
    if (typeof targetPostId !== "number") {
      return;
    }

    const targetExists = posts.some((post) => post.id === targetPostId);
    if (!targetExists) {
      return;
    }

    setHighlightedPostId(targetPostId);

    const scrollTimeout = window.setTimeout(() => {
      const element = document.getElementById(`mypage-post-${targetPostId}`);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const highlightTimeout = window.setTimeout(() => {
      setHighlightedPostId((current) =>
        current === targetPostId ? null : current,
      );
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [posts, targetPostId]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const sectionTitle = categorySlug ? "게시물" : "내가 쓴 글";

  return (
    <section className="space-y-4" id="mypage-posts">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{sectionTitle}</h2>
          <span className="text-sm font-medium text-muted-foreground">
            {totalCount}
          </span>
        </div>
        {categorySlug ? <PostSortButton /> : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">작성한 글이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {posts.map((post) => (
              <div
                key={post.id}
                id={post.id > 0 ? `mypage-post-${post.id}` : undefined}
                className="rounded-xl transition-colors"
              >
                <PostCard
                  id={post.id}
                  title={post.title}
                  description={post.content}
                  thumbnail={post.thumbnail}
                  category={post.category_name}
                  author="나"
                  authorImage={post.author_image}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  createdAt={new Date(post.created_at)}
                  isHidden={post.is_hidden}
                  isSecret={post.is_secret}
                  hrefOverride={post.href_override}
                  showCategoryBadge={!post.is_draft}
                  className={
                    highlightedPostId === post.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }
                  statusBadges={[
                    post.is_draft
                      ? {
                          text: "임시저장",
                          className: "border-sky-300 bg-sky-100 text-black",
                        }
                      : null,
                  ].filter((badge) => badge !== null)}
                />
              </div>
            ))}
          </div>
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
