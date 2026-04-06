import type { Metadata } from "next";
import Link from "next/link";
import { notices } from "@/lib/notices";

export const metadata: Metadata = {
  title: "공지사항 | c.horok",
  description: "c.horok 공지사항과 운영 소식을 확인하세요.",
};

function getNoticeLabel(isPinned?: boolean) {
  return isPinned
    ? {
        text: "중요",
        className:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
      }
    : {
        text: "공지",
        className:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
      };
}

export default function NoticesPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">공지사항</h2>
        {/* <p className="text-sm text-muted-foreground">
          서비스 소식과 업데이트 안내를 확인할 수 있습니다.
        </p> */}
      </div>

      <div className="overflow-x-auto border-t border-border">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="border-y border-border">
              <th className="w-20 px-4 py-3 text-center font-medium">번호</th>
              <th className="w-24 px-4 py-3 text-center font-medium">구분</th>
              <th className="min-w-[320px] px-4 py-3 text-left font-medium">
                제목
              </th>
              <th className="w-32 px-4 py-3 text-center font-medium">등록일</th>
            </tr>
          </thead>

          <tbody>
            {notices.map((notice, index) => {
              const noticeLabel = getNoticeLabel(notice.isPinned);

              return (
                <tr
                  key={notice.slug}
                  className="border-b border-border transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-4 text-center text-muted-foreground">
                    {notices.length - index}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${noticeLabel.className}`}
                    >
                      {noticeLabel.text}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/notices/${notice.slug}`} className="block">
                      <p className="truncate font-medium text-foreground">
                        {notice.title}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center text-muted-foreground">
                    <time dateTime={notice.publishedAt}>
                      {notice.publishedAt}
                    </time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
