import type { Metadata } from "next";
import HorokCoteBackgroundPattern from "@/components/horok-cote/HorokCoteBackgroundPattern";
import HorokCoteCatalog from "@/components/horok-cote/HorokCoteCatalog";
import { HOROK_COTE_LEVELS, horokCoteProblems } from "@/lib/horok-cote";

export const metadata: Metadata = {
  title: "호록 코딩테스트 | horok-cote",
  description:
    "호록 코딩의 문제 목록과 IDE형 풀이 화면을 제공하는 코딩테스트 메인 페이지",
  alternates: {
    canonical: "/horok-cote",
  },
};

type HorokCotePageProps = {
  searchParams: Promise<{
    level?: string;
  }>;
};

export default async function HorokCotePage({
  searchParams,
}: HorokCotePageProps) {
  const { level } = await searchParams;
  const initialSelectedLevel =
    HOROK_COTE_LEVELS.find((candidateLevel) => candidateLevel === level) ??
    HOROK_COTE_LEVELS[0];

  return (
    <main className="relative h-dvh overflow-hidden bg-[#06923E] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <HorokCoteBackgroundPattern />
      <div className="relative mx-auto flex h-full max-w-[1680px] flex-col">
        <section
          id="problem-list"
          className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_22px_60px_rgba(2,6,23,0.45)] sm:p-6"
        >
          <HorokCoteCatalog
            problems={horokCoteProblems}
            initialSelectedLevel={initialSelectedLevel}
          />
        </section>
      </div>
    </main>
  );
}
