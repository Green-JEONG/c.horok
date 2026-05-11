"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseSortType, type SortType } from "@/lib/post-sort";

const SORT_LABEL: Record<SortType, string> = {
  latest: "최신순",
  oldest: "오래된순",
  views: "조회순",
  likes: "북마크순",
  comments: "댓글순",
  category: "카테고리순 (오름차)",
  categoryDesc: "카테고리순 (내림차)",
};

const DEFAULT_SORT_OPTIONS: SortType[] = [
  "latest",
  "oldest",
  "views",
  "likes",
  "comments",
  "category",
  "categoryDesc",
];

function getSortMenuWidth(trigger: HTMLButtonElement, sortOptions: SortType[]) {
  const context = document.createElement("canvas").getContext("2d");
  const font = window.getComputedStyle(trigger).font;
  const labelWidth =
    context && font
      ? Math.ceil(
          Math.max(
            ...sortOptions.map((option) => {
              context.font = font;
              return context.measureText(SORT_LABEL[option]).width;
            }),
          ),
        )
      : 112;

  return labelWidth + 24;
}

type Props = {
  sortOptions?: SortType[];
};

export default function PostSortButton({
  sortOptions = DEFAULT_SORT_OPTIONS,
}: Props) {
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
      const menuWidth = getSortMenuWidth(trigger, sortOptions);
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
  }, [open, sortOptions]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-3 text-sm transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="whitespace-nowrap">
          {SORT_LABEL[sortOptions.includes(sort) ? sort : sortOptions[0]]}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-100 rounded-md border bg-background text-sm shadow-md"
              style={menuStyle}
            >
              {sortOptions.map((key) => (
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
                    className="w-full whitespace-nowrap px-3 py-2 text-left hover:bg-muted"
                  >
                    {SORT_LABEL[key]}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}
