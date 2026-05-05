"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { horokCoteProblems } from "@/lib/horok-cote";

type HorokCoteProblemQuickSearchProps = {
  number: number;
  title: string;
};

export default function HorokCoteProblemQuickSearch({
  number,
  title,
}: HorokCoteProblemQuickSearchProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return horokCoteProblems.slice(0, 6);
    }

    return horokCoteProblems
      .filter((problem) => {
        const fullLabel = `${problem.number} ${problem.title}`.toLowerCase();
        return (
          String(problem.number).includes(trimmedQuery) ||
          problem.title.toLowerCase().includes(trimmedQuery) ||
          fullLabel.includes(trimmedQuery)
        );
      })
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsEditing(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isEditing]);

  const handleSelectProblem = (slug: string) => {
    const selectedProblem = horokCoteProblems.find(
      (problem) => problem.slug === slug,
    );

    if (!selectedProblem) {
      return;
    }

    setIsEditing(false);
    setQuery("");
    router.push(`/horok-cote/${selectedProblem.number}`);
  };

  if (!isEditing) {
    return (
      <div className="relative inline-flex">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onDoubleClick={() => setIsEditing(true)}
            className="cursor-text text-sm font-semibold text-slate-950 outline-none dark:text-slate-50"
          >
            {number}번
          </button>
          <button
            type="button"
            onDoubleClick={() => setIsEditing(true)}
            className="cursor-text text-sm text-slate-600 outline-none dark:text-slate-300"
          >
            {title}
          </button>
        </div>
        <div className="pointer-events-none absolute left-1 top-[calc(100%+8px)] z-20">
          <span className="absolute -top-1 left-3 h-2 w-2 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
          <button
            type="button"
            onDoubleClick={() => setIsEditing(true)}
            className="pointer-events-auto whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 dark:shadow-[0_10px_22px_rgba(2,6,23,0.28)]"
          >
            더블클릭해 검색
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="inline-flex min-w-[280px] items-center gap-2 rounded-[999px] border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Search className="size-4 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsEditing(false);
              setQuery("");
            }

            if (event.key === "Enter" && suggestions[0]) {
              handleSelectProblem(suggestions[0].slug);
            }
          }}
          placeholder="문제 번호 또는 제목 입력"
          className="w-full border-0 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_36px_rgba(2,6,23,0.5)]">
        {suggestions.length > 0 ? (
          <div className="space-y-1">
            {suggestions.map((problem) => (
              <button
                key={problem.slug}
                type="button"
                onClick={() => handleSelectProblem(problem.slug)}
                className="flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {problem.number}번
                </span>
                <span className="ml-3 flex-1 truncate text-sm text-slate-600 dark:text-slate-300">
                  {problem.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-500">
            준비중입니다.
          </div>
        )}
      </div>
    </div>
  );
}
