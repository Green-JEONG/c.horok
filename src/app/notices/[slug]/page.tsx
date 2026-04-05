import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoticeBySlug, notices } from "@/lib/notices";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return notices.map((notice) => ({
    slug: notice.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notice = getNoticeBySlug(slug);

  if (!notice) {
    return {
      title: "공지사항 | c.horok",
    };
  }

  return {
    title: `${notice.title} | 공지사항 | c.horok`,
    description: notice.summary,
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { slug } = await params;
  const notice = getNoticeBySlug(slug);

  if (!notice) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Link
          href="/notices"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          공지사항 목록으로
        </Link>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              공지사항
            </span>
            {notice.isPinned ? (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                중요
              </span>
            ) : null}
            <time dateTime={notice.publishedAt}>{notice.publishedAt}</time>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {notice.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {notice.summary}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="space-y-4 text-sm leading-7 text-foreground sm:text-base">
          {notice.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
