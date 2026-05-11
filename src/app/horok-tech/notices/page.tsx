import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import HomeWriteButton from "@/components/home/HomeWriteButton";
import NoticeCategorySearch from "@/components/posts/NoticeCategorySearch";
import NoticeListInfinite from "@/components/posts/NoticeListInfinite";
import PostListHeader from "@/components/posts/PostListHeader";
import PostSortButton from "@/components/posts/PostSortButton";
import {
  NOTICE_SEARCH_PARAM_BY_CATEGORY,
  NOTICE_TAG_OPTIONS,
  type NoticeTag,
  parseNoticeCategory,
  parseNoticeSearchTarget,
} from "@/lib/notice-categories";
import { countNoticesByCategory, findNotices } from "@/lib/notices";
import { parseSortType } from "@/lib/post-sort";

export const metadata: Metadata = {
  title: "공지사항 | c.horok",
  description: "c.horok 공지사항과 운영 소식을 확인하세요.",
  alternates: {
    canonical: "/horok-tech/notices",
  },
};

export default async function HorokTechNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    page?: string;
    target?: string;
    noticeQ?: string;
    faqQ?: string;
    qnaQ?: string;
    bugQ?: string;
    noticeSearchTarget?: string;
  }>;
}) {
  const {
    sort,
    category,
    page,
    target,
    noticeQ,
    faqQ,
    qnaQ,
    bugQ,
    noticeSearchTarget,
  } = await searchParams;
  const parsedSort = parseSortType(sort);
  const parsedCategory = parseNoticeCategory(category) ?? NOTICE_TAG_OPTIONS[0];
  const searchTarget = parseNoticeSearchTarget(noticeSearchTarget);
  const searchQueryByCategory: Partial<Record<NoticeTag, string | undefined>> =
    {
      공지: noticeQ,
      FAQ: faqQ,
      QnA: qnaQ,
      "버그 제보": bugQ,
    };
  const parsedPage = Number(page ?? "1");
  const targetNoticeId = Number(target ?? "");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const session = await auth();
  const sessionUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const validSessionUserId =
    typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
      ? sessionUserId
      : null;
  const isQnaCategory = parsedCategory === "QnA";
  const isBugCategory = parsedCategory === "버그 제보";
  const notices = await findNotices(parsedSort, parsedCategory, {
    viewerUserId: validSessionUserId,
    isAdmin: session?.user?.role === "ADMIN",
    query: searchQueryByCategory[parsedCategory],
    searchTarget,
  });
  const noticeCounts = await countNoticesByCategory(
    searchQueryByCategory,
    searchTarget,
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(notices.length / pageSize));
  const resolvedPage =
    Number.isFinite(targetNoticeId) && targetNoticeId > 0
      ? (() => {
          const targetIndex = notices.findIndex(
            (notice) => notice.id === targetNoticeId,
          );

          if (targetIndex < 0) {
            return currentPage;
          }

          return Math.floor(targetIndex / pageSize) + 1;
        })()
      : currentPage;
  const safePage = Math.min(resolvedPage, totalPages);
  const pagedNotices = notices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const isFaqCategory = parsedCategory === "FAQ";
  const isAdmin = session?.user?.role === "ADMIN";
  const canWriteNotice =
    isQnaCategory || isBugCategory ? Boolean(session?.user) : isAdmin;
  const writeButtonHref = isQnaCategory
    ? "/horok-tech/notices/new?category=QnA"
    : isBugCategory
      ? "/horok-tech/notices/new?category=%EB%B2%84%EA%B7%B8%20%EC%A0%9C%EB%B3%B4"
      : isFaqCategory
        ? "/horok-tech/notices/new?category=FAQ"
        : "/horok-tech/notices/new";
  const writeButtonLabel = isQnaCategory
    ? "질문하기"
    : isBugCategory
      ? "버그 제보"
      : isFaqCategory
        ? "FAQ 작성"
        : "공지 작성";
  const categoryTabs = NOTICE_TAG_OPTIONS.map((value) => ({
    label: value,
    value,
  }));

  return (
    <section className="space-y-4">
      <PostListHeader
        title={
          <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
            <span className="shrink-0">공지사항</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{parsedCategory}</span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {noticeCounts[parsedCategory]}
            </span>
          </span>
        }
        showSortButton={false}
        headerActions={
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <NoticeCategorySearch category={parsedCategory} />
            <PostSortButton />
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((tab) => {
            const params = new URLSearchParams();

            if (sort) {
              params.set("sort", sort);
            }

            if (noticeSearchTarget) {
              params.set("noticeSearchTarget", searchTarget);
            }

            for (const [noticeCategory, paramName] of Object.entries(
              NOTICE_SEARCH_PARAM_BY_CATEGORY,
            )) {
              const value =
                searchQueryByCategory[
                  noticeCategory as keyof typeof searchQueryByCategory
                ];

              if (value) {
                params.set(paramName, value);
              }
            }

            params.set("category", tab.value);

            const href = params.toString()
              ? `/horok-tech/notices?${params.toString()}`
              : "/horok-tech/notices";
            const isActive = parsedCategory === tab.value;

            return (
              <Link
                key={tab.label}
                href={href}
                className={`flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }
                >
                  ({noticeCounts[tab.value]})
                </span>
              </Link>
            );
          })}
        </div>
        {canWriteNotice ? (
          <HomeWriteButton
            href={writeButtonHref}
            label={writeButtonLabel}
            className="shrink-0"
          />
        ) : null}
      </div>
      <NoticeListInfinite
        notices={pagedNotices}
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={notices.length}
        isQnaCategory={isQnaCategory}
        isFaqCategory={isFaqCategory}
        emptyMessage={
          isFaqCategory
            ? "아직 등록된 FAQ 게시물이 없습니다."
            : isBugCategory
              ? "아직 등록된 버그 제보가 없습니다."
              : "아직 등록된 공지사항이 없습니다."
        }
      />
    </section>
  );
}
