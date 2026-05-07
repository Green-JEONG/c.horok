"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function BannerBarClient({
  notices,
}: BannerBarClientProps) {
  const items = notices.length > 0 ? notices : [FALLBACK_NOTICE];
  const [index, setIndex] = useState(0);

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

  return (
    <div className="w-full bg-primary">
      <div className="mx-auto max-w-6xl px-4 py-3 text-center">
        <div className="mx-auto flex min-h-10 max-w-3xl items-center justify-center overflow-hidden">
          <Link
            href={activeNotice.href}
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
                i === index ? "bg-primary-foreground" : "bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
