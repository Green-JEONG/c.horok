import type { Metadata } from "next";
import HorokCoteProblemBrowser from "@/components/horok-cote/HorokCoteProblemBrowser";
import { horokCoteProblems } from "@/lib/horok-cote";

export const metadata: Metadata = {
  title: "코딩테스트 | c.horok",
  description:
    "호록코딩의 문제 목록과 IDE형 풀이 화면을 제공하는 코딩테스트 메인 페이지",
  alternates: {
    canonical: "/horok-cote",
  },
};

export default function HorokCotePage() {
  return (
    <main className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(112,209,149,0.18),_transparent_28%),linear-gradient(180deg,_#f8fff9_0%,_#f5fbff_48%,_#f8fafc_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col">
        <section
          id="problem-list"
          className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-6"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#44bb68]">
                Problem Set
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                문제를 누르면 바로 IDE로 이어집니다
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              난이도와 태그를 보고 문제를 고른 뒤 바로 Python 또는 Java IDE로
              들어갈 수 있습니다.
            </p>
          </div>
          <HorokCoteProblemBrowser problems={horokCoteProblems} />
        </section>
      </div>
    </main>
  );
}
