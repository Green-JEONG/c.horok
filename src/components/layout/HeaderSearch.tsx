"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useDeferredValue, useEffect, useRef, useState } from "react";
import SearchTargetDropdown from "@/components/posts/SearchTargetDropdown";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import {
  POST_SEARCH_TARGET_LABEL,
  parsePostSearchTarget,
} from "@/lib/post-search-target";
import {
  getTechFaqPath,
  getTechFeedPostPath,
  getTechNoticePath,
} from "@/lib/routes";

type SearchSuggestion = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  category_name: string;
  author_name: string;
};

type UserSuggestion = {
  id: number;
  name: string | null;
  image: string | null;
  followerCount: number;
  postCount: number;
};

type SearchSuggestionResponse = {
  users: UserSuggestion[];
  posts: SearchSuggestion[];
};

const SEARCH_PREVIEW_GROUPS = [
  {
    label: "게시물",
    matches: (post: SearchSuggestion) =>
      !isNoticeCategoryName(post.category_name),
  },
  {
    label: "공지",
    matches: (post: SearchSuggestion) => post.category_name === "공지",
  },
  {
    label: "FAQ",
    matches: (post: SearchSuggestion) => post.category_name === "FAQ",
  },
  {
    label: "QnA",
    matches: (post: SearchSuggestion) => post.category_name === "QnA",
  },
] as const;

function getSuggestionHref(post: SearchSuggestion) {
  return post.category_name === "FAQ"
    ? getTechFaqPath(post.id)
    : isNoticeCategoryName(post.category_name)
      ? getTechNoticePath(post.id)
      : getTechFeedPostPath(post.id);
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTarget, setSearchTarget] = useState(
    parsePostSearchTarget("title"),
  );
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(
      `/search?q=${encodeURIComponent(query)}&searchTarget=${searchTarget}`,
    );
  }

  useEffect(() => {
    const trimmedQuery = deferredQuery.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setUserSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmedQuery)}&searchTarget=${searchTarget}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          setUserSuggestions([]);
          return;
        }

        const data = (await response.json()) as SearchSuggestionResponse;
        setUserSuggestions(Array.isArray(data.users) ? data.users : []);
        setSuggestions(Array.isArray(data.posts) ? data.posts : []);
        setIsOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setUserSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, searchTarget]);

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
  const hasSuggestions = userSuggestions.length > 0 || suggestions.length > 0;
  const suggestionGroups = SEARCH_PREVIEW_GROUPS.map((group) => ({
    label: group.label,
    posts: suggestions.filter(group.matches),
  })).filter((group) => group.posts.length > 0);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={onSubmit}
        className="flex h-9 w-full items-center overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-primary"
      >
        <SearchTargetDropdown
          value={searchTarget}
          onChange={(value) => setSearchTarget(value)}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={`${POST_SEARCH_TARGET_LABEL[searchTarget]} 검색`}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
          aria-label="검색"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {shouldShowSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-background shadow-xl">
          {isLoading ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              검색 결과를 찾는 중...
            </p>
          ) : hasSuggestions ? (
            <ul className="max-h-80 overflow-y-auto">
              {userSuggestions.length > 0 ? (
                <>
                  <li className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
                    유저
                  </li>
                  {userSuggestions.map((user) => (
                    <li
                      key={`user-${user.id}`}
                      className="border-b last:border-b-0"
                    >
                      <Link
                        href={`/users/${user.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                      >
                        <Image
                          src={user.image ?? "/logo.svg"}
                          alt={`${user.name ?? "사용자"} 프로필`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full border object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {user.name ?? "이름 없는 사용자"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {`구독자 ${user.followerCount}명 · 글 ${user.postCount}개`}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </>
              ) : null}
              {suggestionGroups.map((group) => (
                <Fragment key={group.label}>
                  <li className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </li>
                  {group.posts.map((post) => (
                    <li key={post.id} className="border-b last:border-b-0">
                      <Link
                        href={getSuggestionHref(post)}
                        onClick={() => setIsOpen(false)}
                        className="flex items-stretch gap-3 px-4 py-3 transition hover:bg-muted/60"
                      >
                        <div className="relative w-14 shrink-0 self-stretch overflow-hidden rounded-lg bg-zinc-900">
                          <Image
                            src={post.thumbnail ?? "/thumbnails/default.png"}
                            alt={post.title}
                            fill
                            unoptimized={Boolean(post.thumbnail)}
                            className={
                              post.thumbnail
                                ? "object-cover"
                                : "object-contain p-3"
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">
                            {post.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            #{post.category_name} · {post.author_name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {post.content}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push(
                `/search?q=${encodeURIComponent(query)}&searchTarget=${searchTarget}`,
              );
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
