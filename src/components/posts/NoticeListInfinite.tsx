"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import { getTechNoticePath } from "@/lib/routes";

type NoticeListItem = {
  id: number;
  title: string;
  categoryName: string;
  summary: string;
  publishedAt: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
};

type Props = {
  notices: NoticeListItem[];
  emptyMessage?: string;
  currentPage: number;
  totalPages: number;
  isQnaCategory?: boolean;
};

export default function NoticeListInfinite({
  notices,
  emptyMessage = "등록된 공지사항이 없습니다.",
  currentPage,
  totalPages,
  isQnaCategory = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildPageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  if (notices.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border-y bg-background">
        <div className="hidden grid-cols-[minmax(0,1fr)_88px_92px_56px] items-center gap-3 border-b bg-muted/40 px-5 py-3 text-center text-xs font-semibold text-muted-foreground md:grid">
          <span>제목</span>
          <span>작성자</span>
          <span>작성일</span>
          <span>{isQnaCategory ? "상태" : "조회"}</span>
        </div>

        {notices.map((notice) => (
          <Link
            key={notice.id}
            href={getTechNoticePath(notice.id)}
            className="block border-b last:border-b-0 transition-colors hover:bg-muted/30"
          >
            <div className="flex flex-col gap-3 px-4 py-4 md:grid md:grid-cols-[minmax(0,1fr)_88px_92px_56px] md:items-center md:gap-3 md:px-5">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {notice.title}
                  </p>
                  {notice.isLocked ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground md:hidden">
                  <span>{notice.authorName}</span>
                  <span>{notice.publishedAt}</span>
                  <span>
                    {isQnaCategory
                      ? notice.isResolved
                        ? "답변 완료"
                        : "답변 전"
                      : `조회 ${notice.viewCount}`}
                  </span>
                </div>
              </div>

              <span className="hidden truncate text-center text-sm text-muted-foreground md:block">
                {notice.authorName}
              </span>
              <span className="hidden text-center text-sm text-muted-foreground md:block">
                {notice.publishedAt}
              </span>
              <div className="hidden text-center text-sm text-muted-foreground md:block">
                {isQnaCategory
                  ? notice.isResolved
                    ? "답변 완료"
                    : "답변 전"
                  : notice.viewCount}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 ? (
        <SectionPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            router.push(buildPageHref(page));
          }}
        />
      ) : null}
    </div>
  );
}
