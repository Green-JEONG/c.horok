import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import NoticeListInfinite from "@/components/posts/NoticeListInfinite";
import PostListHeader from "@/components/posts/PostListHeader";
import {
  NOTICE_TAG_OPTIONS,
  parseNoticeCategory,
} from "@/lib/notice-categories";
import { findNotices } from "@/lib/notices";
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
  searchParams: Promise<{ sort?: string; category?: string; page?: string }>;
}) {
  const { sort, category, page } = await searchParams;
  const parsedSort = parseSortType(sort);
  const parsedCategory = parseNoticeCategory(category) ?? NOTICE_TAG_OPTIONS[0];
  const parsedPage = Number(page ?? "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const session = await auth();
  const sessionUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const notices = await findNotices(parsedSort, parsedCategory, {
    viewerUserId:
      typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
        ? sessionUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(notices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedNotices = notices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const isQnaCategory = parsedCategory === "QnA";
  const isAdmin = session?.user?.role === "ADMIN";
  const canWriteNotice = isAdmin || (Boolean(session?.user) && isQnaCategory);
  const categoryTabs = NOTICE_TAG_OPTIONS.map((value) => ({
    label: value,
    value,
  }));

  return (
    <section className="space-y-4">
      <PostListHeader
        title="공지사항"
        showWriteButton={canWriteNotice}
        writeButtonHref="/horok-tech/notices/new"
        writeButtonLabel={isQnaCategory ? "질문하기" : "공지 작성"}
      />

      <div className="flex flex-wrap gap-2">
        {categoryTabs.map((tab) => {
          const params = new URLSearchParams();

          if (sort) {
            params.set("sort", sort);
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
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-primary bg-background text-primary"
                  : "border-border bg-background text-foreground hover:border-muted-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <NoticeListInfinite
        notices={pagedNotices}
        currentPage={safePage}
        totalPages={totalPages}
        isQnaCategory={isQnaCategory}
        emptyMessage="아직 등록된 공지사항이 없습니다."
      />
    </section>
  );
}
