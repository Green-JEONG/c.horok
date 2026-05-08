import type { Metadata } from "next";
import ErrorState from "@/components/common/ErrorState";
import HorokCoteBackgroundPattern from "@/components/horok-cote/HorokCoteBackgroundPattern";
import HorokCoteProblemHeader from "@/components/horok-cote/HorokCoteProblemHeader";
import HorokCoteWorkspace from "@/components/horok-cote/HorokCoteWorkspace";
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
    return (
      <main className="relative h-dvh overflow-hidden bg-[#06923E] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
        <HorokCoteBackgroundPattern />
        <div className="relative mx-auto flex h-full max-w-[1680px] flex-col">
          <section className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-[#020617] dark:shadow-[0_22px_60px_rgba(2,6,23,0.45)] sm:p-6">
            <ErrorState
              code={404}
              message="요청하신 페이지를 찾을 수 없습니다. 주소가 올바른지 확인해 주세요."
              className="min-h-0 flex-1 px-0 py-0"
              contentClassName="rounded-[28px] bg-white px-6 py-10 dark:bg-[#020617]"
            />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#06923E] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <HorokCoteBackgroundPattern />
      <div className="relative mx-auto flex h-full max-w-[1680px] flex-col">
        <section className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_22px_60px_rgba(2,6,23,0.45)] sm:p-6">
          <HorokCoteProblemHeader
            level={problem.level}
            number={problem.number}
            title={problem.title}
          />
          <HorokCoteWorkspace problem={problem} />
        </section>
      </div>
    </main>
  );
}
