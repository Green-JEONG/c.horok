"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import { getTechFeedPostPath, getTechNoticePath } from "@/lib/routes";

type SearchSuggestion = {
  id: number;
  title: string;
  content: string;
  category_name: string;
  author_name: string;
};

function getSuggestionHref(post: SearchSuggestion) {
  return isNoticeCategoryName(post.category_name)
    ? getTechNoticePath(post.id)
    : getTechFeedPostPath(post.id);
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  useEffect(() => {
    const trimmedQuery = deferredQuery.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as SearchSuggestion[];
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const shouldShowSuggestions = query.trim().length >= 2 && isOpen;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={onSubmit} className="relative w-full">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder="검색"
          className="h-8 w-full rounded-full border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      {shouldShowSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-background shadow-xl">
          {isLoading ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              게시물을 찾는 중...
            </p>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {suggestions.map((post) => (
                <li key={post.id} className="border-b last:border-b-0">
                  <Link
                    href={getSuggestionHref(post)}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 transition hover:bg-muted/60"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {post.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      #{post.category_name} · {post.author_name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {post.content}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              유사한 게시물이 없습니다.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="w-full border-t px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted/60"
          >
            전체 검색 결과 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
