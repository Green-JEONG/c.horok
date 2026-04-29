import { ArrowLeft, ChevronRight, FileCode2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HorokCoteIDE from "@/components/horok-cote/HorokCoteIDE";
import { Badge } from "@/components/ui/badge";
import { getHorokCoteProblem, horokCoteProblems } from "@/lib/horok-cote";

type HorokCoteProblemPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return horokCoteProblems.map((problem) => ({
    slug: problem.slug,
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
      canonical: `/horok-cote/${problem.slug}`,
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
    <main className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(112,209,149,0.18),_transparent_28%),linear-gradient(180deg,_#f8fff9_0%,_#f5fbff_48%,_#f8fafc_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col">
        <section className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link
                href="/horok-cote"
                className="inline-flex items-center gap-1 transition hover:text-slate-900"
              >
                <ArrowLeft className="size-4" />
                문제 목록으로
              </Link>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span>horok cote</span>
              <ChevronRight className="hidden size-4 text-slate-300 sm:inline" />
              <span className="font-medium text-slate-900">
                {problem.title}
              </span>
            </div>

            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-950 text-white hover:bg-slate-950">
                    {problem.level}
                  </Badge>
                  <Badge variant="outline">{problem.category}</Badge>
                  {problem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    {problem.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                    {problem.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">권장 시간</p>
                  <p className="mt-1 text-lg font-bold">{problem.duration}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">정답률</p>
                  <p className="mt-1 text-lg font-bold">
                    {problem.acceptanceRate}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">지원 언어</p>
                  <p className="mt-1 text-lg font-bold">Python / Java</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(540px,1.05fr)]">
            <section className="scrollbar-hide min-h-0 overflow-y-auto rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <FileCode2 className="size-4" />
                  문제 설명
                </div>
                <p className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                  {problem.prompt}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-1">
                  <h2 className="text-sm font-semibold text-slate-900">
                    제한사항
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {problem.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-1">
                  <h2 className="text-sm font-semibold text-slate-900">입력</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {problem.inputDescription.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-1">
                  <h2 className="text-sm font-semibold text-slate-900">출력</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {problem.outputDescription.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Sparkles className="size-4" />
                  예제
                </div>
                {problem.examples.map((example, index) => (
                  <article
                    key={`${problem.slug}-${index + 1}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      예제 {index + 1}
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-medium text-slate-500">
                          입력
                        </p>
                        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700">
                          {example.input}
                        </pre>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-medium text-slate-500">
                          출력
                        </p>
                        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700">
                          {example.output}
                        </pre>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
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
