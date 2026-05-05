"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HorokCoteProblem } from "@/lib/horok-cote";
import { cn } from "@/lib/utils";

type Language = "python" | "java" | "cpp";

type RunResult = "idle" | "success" | "failure";

type HorokCoteIDEProps = {
  problem: HorokCoteProblem;
};

type ExecutionState = {
  status: RunResult;
  output: string;
  message: string;
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
  cpp: {
    label: "C++17",
    runtime: "cpp17",
    fileName: "main.cpp",
    badgeClassName: "bg-violet-100 text-violet-700",
    tabClassName: "bg-violet-50 text-violet-700",
  },
};

export default function HorokCoteIDE({ problem }: HorokCoteIDEProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("python");
  const [editedCodes, setEditedCodes] = useState(problem.starterCodes);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: "idle",
    output: "",
    message: "코드를 실행하면 이곳에 결과가 표시됩니다.",
  });
  const currentLanguage = languageMeta[selectedLanguage];
  const code = editedCodes[selectedLanguage];

  function getSimulatedOutput(language: Language, source: string) {
    const patterns: Record<Language, RegExp[]> = {
      python: [/print\s*\(\s*["'`]([\s\S]*?)["'`]\s*\)/],
      java: [/System\.out\.println\s*\(\s*"([\s\S]*?)"\s*\)/],
      cpp: [/cout\s*<<\s*"([\s\S]*?)"\s*<<\s*['"]\\n['"]/],
    };

    const matched = patterns[language]
      .map((pattern) => source.match(pattern)?.[1])
      .find((value) => typeof value === "string");

    return matched?.replace(/\\n/g, "\n").trimEnd() ?? "";
  }

  function handleRun() {
    const output = getSimulatedOutput(selectedLanguage, code);
    const expected = problem.examples[0]?.output ?? "";
    const isSuccess = output === expected;

    setExecutionState({
      status: isSuccess ? "success" : "failure",
      output,
      message: isSuccess
        ? "실행 결과가 예제 출력과 일치합니다."
        : output
          ? "실행 결과가 기대한 출력과 다릅니다."
          : "출력 결과를 해석하지 못했습니다. 출력문을 다시 확인해 보세요.",
    });
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {(["python", "java", "cpp"] as Language[]).map((language) => {
            const meta = languageMeta[language];
            const isActive = selectedLanguage === language;

            return (
              <button
                key={language}
                type="button"
                onClick={() => {
                  setSelectedLanguage(language);
                  setExecutionState({
                    status: "idle",
                    output: "",
                    message: "코드를 실행하면 이곳에 결과가 표시됩니다.",
                  });
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition",
                  isActive
                    ? meta.badgeClassName
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
            {currentLanguage.fileName}
          </span>
          <Button
            size="sm"
            onClick={handleRun}
            className="bg-[#44bb68] text-white hover:bg-[#389d58]"
          >
            <Play className="size-4" />
            실행
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-h-0 bg-white dark:bg-slate-950">
          <textarea
            value={code}
            onChange={(event) => {
              setEditedCodes((current) => ({
                ...current,
                [selectedLanguage]: event.target.value,
              }));
              setExecutionState({
                status: "idle",
                output: "",
                message: "코드를 실행하면 이곳에 결과가 표시됩니다.",
              });
            }}
            spellCheck={false}
            className="h-full min-h-[260px] w-full resize-none bg-transparent px-4 py-5 font-mono text-[15px] leading-7 text-slate-800 outline-none dark:text-slate-100 sm:px-5 sm:text-base"
            aria-label={`${currentLanguage.label} 코드 에디터`}
          />
        </div>

        <div className="flex min-h-0 flex-col border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              실행 결과
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                executionState.status === "success" &&
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                executionState.status === "failure" &&
                  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                executionState.status === "idle" &&
                  "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {executionState.status === "success"
                ? "일치"
                : executionState.status === "failure"
                  ? "불일치"
                  : "대기"}
            </span>
          </div>

          <div className="min-h-0 flex-1 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="flex h-full min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                stdout
              </div>
              <pre className="min-h-0 flex-1 overflow-auto px-4 py-4 font-mono text-[15px] leading-7 text-slate-800 dark:text-slate-100 sm:text-base">
                {executionState.output || "(출력 없음)"}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900 sm:px-5">
        <p
          className={cn(
            "text-slate-600 dark:text-slate-300",
            executionState.status === "success" &&
              "text-emerald-700 dark:text-emerald-400",
            executionState.status === "failure" &&
              "text-rose-700 dark:text-rose-400",
          )}
        >
          {executionState.message}
        </p>
      </div>
    </section>
  );
}
