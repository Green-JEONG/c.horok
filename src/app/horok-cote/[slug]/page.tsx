import { FileCode2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HorokCoteBackgroundPattern from "@/components/horok-cote/HorokCoteBackgroundPattern";
import HorokCoteIDE from "@/components/horok-cote/HorokCoteIDE";
import HorokCoteProblemHeader from "@/components/horok-cote/HorokCoteProblemHeader";
import { getHorokCoteProblem, horokCoteProblems } from "@/lib/horok-cote";

type HorokCoteProblemPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return horokCoteProblems.map((problem) => ({
    slug: String(problem.number),
  }));
}

export async function generateMetadata({
  params,
}: HorokCoteProblemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const problem = getHorokCoteProblem(slug);

  if (!problem) {
    return {
      title: "문제를 찾을 수 없습니다 | c.horok",
    };
  }

  return {
    title: `${problem.title} | horok cote`,
    description: problem.summary,
    alternates: {
      canonical: `/horok-cote/${problem.number}`,
    },
  };
}

export default async function HorokCoteProblemPage({
  params,
}: HorokCoteProblemPageProps) {
  const { slug } = await params;
  const problem = getHorokCoteProblem(slug);

  if (!problem) {
    notFound();
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#06923E] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <HorokCoteBackgroundPattern />
      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col">
        <section className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_22px_60px_rgba(2,6,23,0.45)] sm:p-6">
          <HorokCoteProblemHeader
            level={problem.level}
            number={problem.number}
            title={problem.title}
          />

          <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(540px,1.05fr)]">
            <section className="scrollbar-hide min-h-0 overflow-y-auto rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <FileCode2 className="size-4" />
                  문제 설명
                </div>
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-[15px]">
                  {problem.prompt}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    제한사항
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {problem.constraints.map((constraint) => (
                      <li key={constraint}>- {constraint}</li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        입력
                      </h2>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {problem.inputDescription.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        출력
                      </h2>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {problem.outputDescription.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Sparkles className="size-4" />
                  예제
                </div>
                {problem.examples.map((example, index) => (
                  <article
                    key={`${problem.slug}-${index + 1}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        예제 {index + 1}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        입력 / 출력
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          입력
                        </p>
                        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
                          {example.input}
                        </pre>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          출력
                        </p>
                        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
                          {example.output}
                        </pre>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {example.explanation}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <HorokCoteIDE problem={problem} />
          </div>
        </section>
      </div>
    </main>
  );
}
