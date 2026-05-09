"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  parseUserSearchSort,
  USER_SEARCH_SORT_LABEL,
  USER_SEARCH_SORT_OPTIONS,
} from "@/lib/user-search-sort";

export default function UserSearchSortButton() {
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
  const sort = parseUserSearchSort(searchParams.get("userSort"));

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
      const menuWidth = Math.max(rect.width, 132);
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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1 rounded-md border px-3 text-sm transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {USER_SEARCH_SORT_LABEL[sort]}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-100 rounded-md border bg-background text-sm shadow-md"
              style={menuStyle}
            >
              {USER_SEARCH_SORT_OPTIONS.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.set("userSort", key);
                      router.push(`${pathname}?${params.toString()}`);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-muted"
                  >
                    {USER_SEARCH_SORT_LABEL[key]}
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
