import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
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
    <article className="mx-auto max-w-3xl">
      <header className="mb-3">
        <h1 className="text-3xl font-bold leading-tight">{notice.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>c.horok 운영팀</span>
          <span>·</span>
          <span>
            <time dateTime={notice.publishedAt}>{notice.publishedAt}</time>
          </span>
          <span>·</span>
          <span
            className={
              notice.isPinned
                ? "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                : "rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
            }
          >
            {notice.isPinned ? "중요 공지" : "공지사항"}
          </span>
        </div>

        <hr className="mt-6" />
      </header>

      <MarkdownRenderer
        content={[notice.summary, ...notice.content].join("\n\n")}
      />
    </article>
  );
}
