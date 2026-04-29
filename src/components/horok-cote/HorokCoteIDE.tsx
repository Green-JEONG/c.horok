"use client";

import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  Code2,
  Play,
  TerminalSquare,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HorokCoteProblem } from "@/lib/horok-cote";
import { cn } from "@/lib/utils";

type Language = "python" | "java";

type HorokCoteIDEProps = {
  problem: HorokCoteProblem;
};

const languageMeta: Record<
  Language,
  {
    label: string;
    runtime: string;
    fileName: string;
    badgeClassName: string;
    tabClassName: string;
  }
> = {
  python: {
    label: "Python 3",
    runtime: "python3",
    fileName: "main.py",
    badgeClassName: "bg-[#eef7f1] text-[#2d8f52]",
    tabClassName: "bg-[#f8fffb] text-[#2d8f52]",
  },
  java: {
    label: "Java 21",
    runtime: "java",
    fileName: "Main.java",
    badgeClassName: "bg-sky-100 text-sky-700",
    tabClassName: "bg-[#f8fafc] text-sky-700",
  },
};

export default function HorokCoteIDE({ problem }: HorokCoteIDEProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("python");
  const [editedCodes, setEditedCodes] = useState(problem.starterCodes);
  const currentLanguage = languageMeta[selectedLanguage];
  const code = editedCodes[selectedLanguage];

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Code2 className="size-4 text-[#44bb68]" />
          <span className="font-semibold">horok IDE</span>
          <span className="text-slate-400">{currentLanguage.fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock3 className="size-4" />
            임시 저장
          </Button>
          <Button
            size="sm"
            className="bg-[#44bb68] text-white hover:bg-[#389d58]"
          >
            <Play className="size-4" />
            실행
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 xl:grid-cols-[1fr_340px]">
        <div className="border-b border-slate-200 xl:border-r xl:border-b-0">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              {(["python", "java"] as Language[]).map((language) => {
                const meta = languageMeta[language];
                const isActive = selectedLanguage === language;

                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setSelectedLanguage(language)}
                    className={cn(
                      "rounded-full px-3 py-1 font-medium transition",
                      isActive
                        ? meta.badgeClassName
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <span>{currentLanguage.label} 선택됨</span>
          </div>

          <div>
            <div
              className={cn(
                "border-b border-slate-200 px-4 py-2 text-xs font-medium sm:px-5",
                currentLanguage.tabClassName,
              )}
            >
              {currentLanguage.fileName}
            </div>
            <textarea
              value={code}
              onChange={(event) =>
                setEditedCodes((current) => ({
                  ...current,
                  [selectedLanguage]: event.target.value,
                }))
              }
              spellCheck={false}
              className="h-[calc(100dvh-23rem)] min-h-[320px] w-full resize-none bg-white px-4 py-5 font-mono text-[13px] leading-6 text-slate-800 outline-none sm:px-5 xl:h-[calc(100dvh-18rem)]"
              aria-label={`${currentLanguage.label} 코드 에디터`}
            />
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_auto_1fr] bg-slate-50">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <TerminalSquare className="size-4 text-sky-600" />
              테스트 케이스
            </div>
            <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-1">
              {problem.testCases.map((testCase) => (
                <div
                  key={testCase.name}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {testCase.name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      {testCase.status === "passed" ? (
                        <CheckCircle2 className="size-4 text-emerald-400" />
                      ) : (
                        <CircleDashed className="size-4 text-amber-300" />
                      )}
                      {testCase.status === "passed" ? "통과" : "대기"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                    <p>
                      <span className="text-slate-500">입력:</span>{" "}
                      {testCase.input}
                    </p>
                    <p>
                      <span className="text-slate-500">기대값:</span>{" "}
                      {testCase.expected}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">출력 콘솔</p>
              <span className="text-xs text-slate-400">최근 실행 2초 전</span>
            </div>
            <div className="mt-3 rounded-2xl bg-[#0f172a] p-3 font-mono text-xs leading-6 text-emerald-300">
              {">"} selected runtime: {currentLanguage.runtime}
              {"\n"}
              {">"} sample tests passed: 1 / {problem.testCases.length}
              {"\n"}
              {">"} ready to submit
            </div>
          </div>

          <div className="flex min-h-0 flex-col justify-between px-4 py-4 sm:px-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">진행 힌트</p>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-slate-700">
                입력 크기를 먼저 보고 정렬, 해시, 스택처럼 필요한 도구를 고른 뒤
                구현 순서를 작게 나누면 훨씬 안정적으로 풀 수 있어요.
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" asChild>
                <Link href="/horok-cote">다른 문제 보기</Link>
              </Button>
              <Button className="bg-slate-950 text-white hover:bg-slate-800">
                제출하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
