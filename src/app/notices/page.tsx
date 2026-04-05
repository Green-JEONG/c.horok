import type { Metadata } from "next";
import Link from "next/link";
import { notices } from "@/lib/notices";

export const metadata: Metadata = {
  title: "공지사항 | c.horok",
  description: "c.horok 공지사항과 운영 소식을 확인하세요.",
};

export default function NoticesPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          공지사항
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          서비스 소식과 업데이트 안내를 확인할 수 있습니다. 첫 번째
          게시글부터 상세 페이지로 바로 이동할 수 있어요.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[112px_1fr_128px] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-sm font-medium text-muted-foreground sm:grid">
          <span>구분</span>
          <span>제목</span>
          <span className="text-right">등록일</span>
        </div>

        <div className="divide-y divide-border">
          {notices.map((notice, index) => (
            <Link
              key={notice.slug}
              href={`/notices/${notice.slug}`}
              className="block px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[112px_1fr_128px] sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
                    공지
                  </span>
                  {notice.isPinned ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      중요
                    </span>
                  ) : null}
                  {index === 0 ? (
                    <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                      첫 글
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                    {notice.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notice.summary}
                  </p>
                </div>

                <time
                  dateTime={notice.publishedAt}
                  className="text-sm text-muted-foreground sm:text-right"
                >
                  {notice.publishedAt}
                </time>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
