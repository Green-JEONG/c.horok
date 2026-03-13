"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>

      <div className="relative flex items-center gap-2">
        {!isLikesPage ? <HomeWriteButton /> : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          {SORT_LABEL[sort]}
          <ChevronDown className="h-4 w-4" />
        </button>

        {open && (
          <ul className="absolute right-0 mt-2 w-24 rounded-md border bg-background shadow-md text-sm z-70">
            {(Object.keys(SORT_LABEL) as SortType[]).map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
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
          </ul>
        )}
      </div>
    </div>
  );
}
