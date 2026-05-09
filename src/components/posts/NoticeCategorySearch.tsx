"use client";

import { ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  NOTICE_SEARCH_PARAM_BY_CATEGORY,
  type NoticeSearchTarget,
  type NoticeTag,
  parseNoticeSearchTarget,
} from "@/lib/notice-categories";

const SEARCH_TARGET_LABEL: Record<NoticeSearchTarget, string> = {
  text: "제목 및 본문",
  author: "유저명",
  category: "카테고리",
};

type Props = {
  category: NoticeTag;
};

export default function NoticeCategorySearch({ category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const targetButtonRef = useRef<HTMLButtonElement>(null);
  const targetMenuRef = useRef<HTMLUListElement>(null);
  const [focused, setFocused] = useState(false);
  const [targetMenuOpen, setTargetMenuOpen] = useState(false);
  const [targetMenuStyle, setTargetMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const paramName = NOTICE_SEARCH_PARAM_BY_CATEGORY[category];
  const searchQuery = searchParams.get(paramName) ?? "";
  const searchTarget = parseNoticeSearchTarget(
    searchParams.get("noticeSearchTarget"),
  );
  const [searchInput, setSearchInput] = useState(searchQuery);

  const replaceSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      nextParams.delete("page");
      nextParams.delete("target");
      nextParams.delete("open");
      nextParams.delete("qnaMine");

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router],
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!targetMenuOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const trigger = targetButtonRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const padding = 8;
      const menuWidth = Math.max(rect.width, 96);
      const estimatedHeight = 120;
      const canOpenDownward =
        rect.bottom + padding + estimatedHeight <= window.innerHeight - padding;

      setTargetMenuStyle({
        top: canOpenDownward
          ? rect.bottom + padding
          : Math.max(padding, rect.top - estimatedHeight - padding),
        left: Math.min(
          Math.max(padding, rect.right - menuWidth),
          window.innerWidth - menuWidth - padding,
        ),
        width: menuWidth,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        targetButtonRef.current?.contains(target) ||
        targetMenuRef.current?.contains(target)
      ) {
        return;
      }

      setTargetMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTargetMenuOpen(false);
      }
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetMenuOpen]);

  useEffect(() => {
    const nextQuery = searchInput.trim();

    if (nextQuery === searchQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextQuery) {
        params.set(paramName, nextQuery);
      } else {
        params.delete(paramName);
      }

      replaceSearchParams(params);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [paramName, replaceSearchParams, searchInput, searchParams, searchQuery]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className={`flex h-9 w-full items-center overflow-hidden rounded-md border bg-background transition-colors sm:w-80 ${
        focused ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <button
        ref={targetButtonRef}
        type="button"
        onClick={() => setTargetMenuOpen((value) => !value)}
        className="flex h-full shrink-0 items-center gap-1 border-r bg-transparent px-2 text-xs font-medium outline-none transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={targetMenuOpen}
        aria-label="검색 범위"
      >
        {SEARCH_TARGET_LABEL[searchTarget]}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <input
        ref={inputRef}
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`${SEARCH_TARGET_LABEL[searchTarget]} 검색`}
        className="h-full min-w-0 flex-1 bg-transparent pl-3 text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => {
          setFocused(true);
          inputRef.current?.focus();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center"
        aria-label={`${category} 검색`}
      >
        <Search className="h-4 w-4" />
      </button>
      {targetMenuOpen && targetMenuStyle
        ? createPortal(
            <ul
              ref={targetMenuRef}
              className="fixed z-100 rounded-md border bg-background text-sm shadow-md"
              style={targetMenuStyle}
            >
              {Object.entries(SEARCH_TARGET_LABEL).map(([value, label]) => (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.set("noticeSearchTarget", value);
                      replaceSearchParams(params);
                      setTargetMenuOpen(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-muted"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </form>
  );
}
