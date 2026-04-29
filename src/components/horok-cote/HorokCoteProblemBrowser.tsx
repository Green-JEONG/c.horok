"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { HorokCoteProblem } from "@/lib/horok-cote";
import { cn } from "@/lib/utils";

type HorokCoteProblemBrowserProps = {
  problems: HorokCoteProblem[];
};

export default function HorokCoteProblemBrowser({
  problems,
}: HorokCoteProblemBrowserProps) {
  const problemsByLevel = Object.entries(
    problems.reduce<Record<string, HorokCoteProblem[]>>((groups, problem) => {
      if (!groups[problem.level]) {
        groups[problem.level] = [];
      }

      groups[problem.level].push(problem);
      return groups;
    }, {}),
  ).sort(([levelA], [levelB]) =>
    levelA.localeCompare(levelB, undefined, { numeric: true }),
  );

  const [selectedLevel, setSelectedLevel] = useState(
    problemsByLevel[0]?.[0] ?? "",
  );

  const selectedProblems =
    problemsByLevel.find(([level]) => level === selectedLevel)?.[1] ?? [];

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {problemsByLevel.map(([level, levelProblems]) => {
          const isActive = level === selectedLevel;

          return (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedLevel(level)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
              )}
            >
              {level}
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-xs",
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {levelProblems.length}
              </span>
            </button>
          );
        })}
      </div>

      <section className="flex min-h-0 flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-950 text-white hover:bg-slate-950">
              {selectedLevel}
            </Badge>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">
              {selectedLevel} 문제 목록
            </h3>
          </div>
          <span className="text-sm text-slate-500">
            총 {selectedProblems.length}문제
          </span>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-4 xl:grid-cols-2">
            {selectedProblems.map((problem) => (
              <Link
                key={problem.slug}
                href={`/horok-cote/${problem.slug}`}
                className="group rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-950 text-white hover:bg-slate-950">
                    {problem.level}
                  </Badge>
                  <Badge variant="outline">{problem.category}</Badge>
                  <span className="text-xs text-slate-400">
                    정답률 {problem.acceptanceRate}
                  </span>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-2xl font-bold tracking-tight text-slate-950">
                      {problem.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {problem.summary}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {problem.duration}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-medium text-[#2d8f52]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
                  <span className="text-slate-500">
                    문제 설명, 코드 에디터, 테스트 케이스 포함
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-950">
                    IDE 열기
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
