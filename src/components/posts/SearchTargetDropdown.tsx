"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  POST_SEARCH_TARGET_LABEL,
  POST_SEARCH_TARGET_OPTIONS,
  type PostSearchTarget,
} from "@/lib/post-search-target";

type Props = {
  value: PostSearchTarget;
  onChange: (value: PostSearchTarget) => void;
  buttonClassName?: string;
  hoverClassName?: string;
};

export default function SearchTargetDropdown({
  value,
  onChange,
  buttonClassName,
  hoverClassName = "hover:bg-muted",
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

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
      const menuWidth = Math.max(rect.width, 96);
      const estimatedHeight = 120;
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
        onClick={() => setOpen((current) => !current)}
        className={
          buttonClassName ??
          `flex h-full shrink-0 items-center gap-1 border-r bg-transparent px-2 text-xs font-medium outline-none transition-colors ${hoverClassName}`
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="검색 범위"
      >
        {POST_SEARCH_TARGET_LABEL[value]}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-100 rounded-md border bg-background text-sm shadow-md"
              style={menuStyle}
            >
              {POST_SEARCH_TARGET_OPTIONS.map((target) => (
                <li key={target}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(target);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left ${hoverClassName}`}
                  >
                    {POST_SEARCH_TARGET_LABEL[target]}
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
