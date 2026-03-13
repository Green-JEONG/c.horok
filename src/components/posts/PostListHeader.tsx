"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseSortType, type SortType } from "@/lib/post-sort";
import HomeWriteButton from "../home/HomeWriteButton";

const SORT_LABEL: Record<SortType, string> = {
  latest: "최신순",
  views: "조회순",
  likes: "좋아요순",
  comments: "댓글순",
};

export default function PostListHeader() {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parseSortType(searchParams.get("sort"));
  const category = searchParams.get("category");

  const isFeedPage = pathname === "/feed" || pathname.startsWith("/feed/");
  const isLikesPage = pathname === "/likes" || pathname.startsWith("/likes/");

  const title = category
    ? `#${category}`
    : isLikesPage
      ? "좋아요"
      : isFeedPage
        ? "피드"
        : "내 글";

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateMenuPosition = () => {
      const trigger = buttonRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const padding = 8;
      const menuWidth = Math.max(rect.width, 112);
      const estimatedHeight = 168;
      const canOpenDownward =
        rect.bottom + padding + estimatedHeight <= window.innerHeight - padding;

      setMenuStyle({
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
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
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
  }, [open]);

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>

      <div className="flex items-center gap-2">
        {!isLikesPage ? <HomeWriteButton /> : null}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {SORT_LABEL[sort]}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-[100] rounded-md border bg-background text-sm shadow-md"
              style={menuStyle}
            >
              {(Object.keys(SORT_LABEL) as SortType[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.set("sort", key);
                      router.push(`${pathname}?${params.toString()}`);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-muted"
                  >
                    {SORT_LABEL[key]}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
