"use client";

import ErrorState from "@/components/common/ErrorState";
import HorokCoteBackgroundPattern from "@/components/horok-cote/HorokCoteBackgroundPattern";

export default function HorokCoteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative h-dvh overflow-hidden bg-[#06923E] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <HorokCoteBackgroundPattern />
      <div className="relative mx-auto flex h-full max-w-[1680px] flex-col">
        <section className="flex h-full min-h-0 flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-[#020617] dark:shadow-[0_22px_60px_rgba(2,6,23,0.45)] sm:p-6">
          <ErrorState
            code={500}
            message="요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
            className="min-h-0 flex-1 px-0 py-0"
            contentClassName="rounded-[28px] bg-white px-6 py-10 dark:bg-[#020617]"
            codeClassName="text-[#06923E] dark:text-[#46c86f]"
            retryAction={
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md bg-[#06923E] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-[#46c86f] dark:text-slate-950"
              >
                다시 시도
              </button>
            }
          />
        </section>
      </div>
    </main>
  );
}
