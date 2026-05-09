"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import PostCard from "@/components/posts/PostCard";

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

type MyQnaPost = {
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

type MyQnaResponse = {
  posts: MyQnaPost[];
  totalCount: number;
  resolvedPage?: number;
};

export default function MyQnaSection() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<MyQnaPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(DEFAULT_PREVIEW_PAGE_SIZE);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(
    null,
  );
  const targetPostId = useMemo(() => {
    const value = Number(searchParams.get("qnaPostId") ?? "");
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

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

        const response = await fetch(`/api/mypage/qna?${params.toString()}`);
        const data: MyQnaResponse = await response.json();

        if (cancelled) return;

        if (
          typeof data.resolvedPage === "number" &&
          data.resolvedPage > 0 &&
          data.resolvedPage !== page
        ) {
          setPage(data.resolvedPage);
        }
        setPosts(Array.isArray(data.posts) ? data.posts : []);
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
  }, [page, pageSize, targetPostId]);

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
      const element = document.getElementById(`mypage-qna-${targetPostId}`);
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

  return (
    <section className="space-y-4" id="mypage-qna">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">내가 쓴 QnA</h2>
        <span className="text-sm font-medium text-muted-foreground">
          {totalCount}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">작성한 QnA가 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {posts.map((post) => (
              <div
                key={post.id}
                id={`mypage-qna-${post.id}`}
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
                  className={
                    highlightedPostId === post.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }
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
