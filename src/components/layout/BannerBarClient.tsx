"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type BannerNotice = {
  id: number;
  title: string;
  href: string;
};

type BannerBarClientProps = {
  notices: BannerNotice[];
};

const FALLBACK_NOTICE: BannerNotice = {
  id: 0,
  title: "등록된 공지사항이 없습니다.",
  href: "/horok-tech/notices",
};

export default function BannerBarClient({ notices }: BannerBarClientProps) {
  const items = notices.length > 0 ? notices : [FALLBACK_NOTICE];
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [items.length]);

  const activeNotice = items[index];
  const goToPrevious = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };
  const goToNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };
  const handleSwipeEnd = (clientX: number) => {
    const startX = pointerStartXRef.current;
    pointerStartXRef.current = null;
    setIsDragging(false);

    if (startX === null || items.length <= 1) {
      return;
    }

    const deltaX = clientX - startX;
    if (Math.abs(deltaX) < 40) {
      didSwipeRef.current = false;
      return;
    }

    didSwipeRef.current = true;
    if (deltaX > 0) {
      goToPrevious();
      return;
    }

    goToNext();
  };

  return (
    <div className="w-full bg-primary">
      <section
        aria-label="배너 공지"
        className={`mx-auto max-w-6xl touch-pan-y select-none px-4 py-3 text-center ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerStartXRef.current = event.clientX;
          didSwipeRef.current = false;
          setIsDragging(true);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          handleSwipeEnd(event.clientX);
        }}
        onPointerCancel={() => {
          pointerStartXRef.current = null;
          didSwipeRef.current = false;
          setIsDragging(false);
        }}
        onDragStart={(event) => {
          event.preventDefault();
        }}
        onClickCapture={(event) => {
          if (!didSwipeRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          window.setTimeout(() => {
            didSwipeRef.current = false;
          }, 0);
        }}
      >
        <div className="mx-auto flex min-h-10 max-w-3xl items-center justify-center overflow-hidden">
          <Link
            href={activeNotice.href}
            draggable={false}
            className="block break-keep text-sm leading-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:whitespace-nowrap"
          >
            <span>{activeNotice.title}</span>
          </Link>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {items.map((notice, i) => (
            <button
              key={`${notice.id}-${notice.title}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`배너 ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === index
                  ? "bg-primary-foreground"
                  : "bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
