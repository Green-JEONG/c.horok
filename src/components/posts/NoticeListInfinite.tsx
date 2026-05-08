"use client";

import { ChevronDown, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import PostEditor from "@/components/posts/PostEditor";
import { getTechNoticePath } from "@/lib/routes";

type NoticeListItem = {
  id: number;
  title: string;
  categoryName: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  publishedAt: string;
  authorName: string;
  authorImage: string | null;
  isPinned: boolean;
  isLocked: boolean;
  isSecret: boolean;
  canViewSecret: boolean;
  isBanner: boolean;
  isOwner: boolean;
  canManageBanner: boolean;
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
  totalCount: number;
  isQnaCategory?: boolean;
  isFaqCategory?: boolean;
};

export default function NoticeListInfinite({
  notices,
  emptyMessage = "등록된 공지사항이 없습니다.",
  currentPage,
  totalPages,
  totalCount,
  isQnaCategory = false,
  isFaqCategory = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialOpenFaqId = Number(searchParams.get("open") ?? "");
  const targetNoticeId = Number(searchParams.get("target") ?? "");
  const [openFaqIds, setOpenFaqIds] = useState<number[]>(
    Number.isFinite(initialOpenFaqId) ? [initialOpenFaqId] : [],
  );
  const [highlightedNoticeId, setHighlightedNoticeId] = useState<number | null>(
    Number.isFinite(targetNoticeId) ? targetNoticeId : null,
  );
  const [viewCounts, setViewCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(notices.map((notice) => [notice.id, notice.viewCount])),
  );

  useEffect(() => {
    setViewCounts(
      Object.fromEntries(
        notices.map((notice) => [notice.id, notice.viewCount]),
      ),
    );
  }, [notices]);

  const trackFaqView = useCallback(async (id: number) => {
    setViewCounts((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));

    try {
      const response = await fetch(`/api/posts/${id}/view`, {
        method: "POST",
      });

      if (!response.ok) {
        setViewCounts((current) => ({
          ...current,
          [id]: Math.max((current[id] ?? 1) - 1, 0),
        }));
      }
    } catch {
      setViewCounts((current) => ({
        ...current,
        [id]: Math.max((current[id] ?? 1) - 1, 0),
      }));
    }
  }, []);

  useEffect(() => {
    if (!isFaqCategory) {
      return;
    }

    const openFaqId = Number(searchParams.get("open") ?? "");

    if (!Number.isFinite(openFaqId)) {
      setOpenFaqIds([]);
      return;
    }

    setOpenFaqIds([openFaqId]);
    void trackFaqView(openFaqId);

    const element = document.getElementById(`faq-notice-${openFaqId}`);
    if (element) {
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [isFaqCategory, searchParams, trackFaqView]);

  useEffect(() => {
    if (isFaqCategory || !Number.isFinite(targetNoticeId)) {
      return;
    }

    const element = document.getElementById(`notice-${targetNoticeId}`);
    if (!element) {
      return;
    }

    setHighlightedNoticeId(targetNoticeId);

    const scrollTimeout = window.setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const highlightTimeout = window.setTimeout(() => {
      setHighlightedNoticeId((current) =>
        current === targetNoticeId ? null : current,
      );
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [isFaqCategory, targetNoticeId]);

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

  function getQnaStatusClassName(isResolved: boolean) {
    return isResolved ? "text-blue-500" : "text-red-500";
  }

  function getQnaStatusLabel(isResolved: boolean) {
    return isResolved ? "답변완료" : "미답변";
  }

  function getQnaStatusSizeClassName(_isResolved: boolean, isMobile: boolean) {
    return isMobile ? "text-xs" : "text-sm";
  }

  function toggleFaq(id: number) {
    const isOpening = !openFaqIds.includes(id);

    setOpenFaqIds((current) =>
      current.includes(id)
        ? current.filter((faqId) => faqId !== id)
        : [...current, id],
    );

    if (isOpening) {
      void trackFaqView(id);
    }
  }

  if (notices.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border-y bg-background">
        <div
          className={`hidden items-center gap-3 border-b bg-muted/40 px-5 py-3 text-center text-xs font-semibold text-muted-foreground md:grid ${
            isQnaCategory
              ? "grid-cols-[48px_minmax(0,1fr)_88px_92px_56px_56px]"
              : "grid-cols-[48px_minmax(0,1fr)_88px_92px_56px]"
          }`}
        >
          <span>번호</span>
          <span>제목</span>
          <span>작성자</span>
          <span>작성일</span>
          <span>조회</span>
          {isQnaCategory ? <span>상태</span> : null}
        </div>

        {notices.map((notice, index) => {
          const isFaqOpen = openFaqIds.includes(notice.id);
          const noticeNumber = totalCount - (currentPage - 1) * 10 - index;
          const titleNode = isFaqCategory ? (
            <button
              type="button"
              onClick={() => toggleFaq(notice.id)}
              className="flex w-full min-w-0 items-center gap-1.5 text-left"
              aria-expanded={isFaqOpen}
            >
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground md:hidden">
                {noticeNumber}
              </span>
              <span className="shrink-0 text-sm font-semibold text-primary">
                Q.
              </span>
              <p className="truncate text-sm font-semibold text-foreground">
                {notice.title}
              </p>
              {notice.isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : null}
              <ChevronDown
                className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  isFaqOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground md:hidden">
                {noticeNumber}
              </span>
              <p className="truncate text-sm font-semibold text-foreground">
                {notice.title}
              </p>
              {notice.isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
          );

          const rowContent = (
            <div
              className={`flex flex-col gap-3 px-4 py-4 md:grid md:items-center md:gap-3 md:px-5 ${
                isQnaCategory
                  ? "md:grid-cols-[48px_minmax(0,1fr)_88px_92px_56px_56px]"
                  : "md:grid-cols-[48px_minmax(0,1fr)_88px_92px_56px]"
              }`}
            >
              <span className="hidden text-center text-sm font-semibold tabular-nums text-muted-foreground md:block">
                {noticeNumber}
              </span>
              <div className="min-w-0">
                {titleNode}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground md:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    <Image
                      src={notice.authorImage ?? "/logo.svg"}
                      alt={`${notice.authorName} 프로필`}
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5 rounded-full border object-cover"
                    />
                    <span>{notice.authorName}</span>
                  </span>
                  <span>{notice.publishedAt}</span>
                  <span>조회 {viewCounts[notice.id] ?? notice.viewCount}</span>
                  {isQnaCategory ? (
                    <span
                      className={`${getQnaStatusSizeClassName(notice.isResolved, true)} font-semibold ${getQnaStatusClassName(notice.isResolved)}`}
                      title={getQnaStatusLabel(notice.isResolved)}
                    >
                      {getQnaStatusLabel(notice.isResolved)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="hidden md:flex md:items-center md:justify-center md:gap-2">
                <Image
                  src={notice.authorImage ?? "/logo.svg"}
                  alt={`${notice.authorName} 프로필`}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full border object-cover"
                />
                <span className="truncate text-sm text-muted-foreground">
                  {notice.authorName}
                </span>
              </div>
              <span className="hidden text-center text-sm text-muted-foreground md:block">
                {notice.publishedAt}
              </span>
              <div className="hidden text-center text-sm text-muted-foreground md:block">
                {viewCounts[notice.id] ?? notice.viewCount}
              </div>
              {isQnaCategory ? (
                <div
                  className={`hidden text-center font-semibold md:block ${getQnaStatusSizeClassName(notice.isResolved, false)} ${getQnaStatusClassName(notice.isResolved)}`}
                  title={getQnaStatusLabel(notice.isResolved)}
                >
                  {getQnaStatusLabel(notice.isResolved)}
                </div>
              ) : null}
            </div>
          );

          if (!isFaqCategory) {
            return (
              <Link
                key={notice.id}
                href={getTechNoticePath(notice.id)}
                id={`notice-${notice.id}`}
                className={`block transition-colors hover:bg-muted/30 ${
                  highlightedNoticeId === notice.id
                    ? "border border-primary bg-primary/5"
                    : "border-b last:border-b-0"
                }`}
              >
                {rowContent}
              </Link>
            );
          }

          return (
            <div
              key={notice.id}
              id={`faq-notice-${notice.id}`}
              className="border-b last:border-b-0 transition-colors hover:bg-muted/20"
            >
              {rowContent}
              {isFaqOpen ? (
                <div className="border-t bg-muted/10 px-4 py-4 md:px-5">
                  <FaqInlineActions notice={notice} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <SectionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          router.push(buildPageHref(page));
        }}
      />
    </div>
  );
}

function FaqInlineActions({ notice }: { notice: NoticeListItem }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("이 게시글을 삭제할까요?");
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${notice.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 삭제에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleHidden() {
    const confirmed = window.confirm(
      "이 게시글을 숨김 처리할까요? 숨김 처리하면 다른 사용자는 볼 수 없습니다.",
    );
    if (!confirmed) return;

    setIsTogglingHidden(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${notice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHidden: true }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 숨김 처리에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("게시글 숨김 처리 중 오류가 발생했습니다.");
    } finally {
      setIsTogglingHidden(false);
    }
  }

  return (
    <div className="space-y-4">
      {notice.isOwner && isEditing ? (
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-start justify-end gap-2 text-sm">
            <button
              type="button"
              disabled={isDeleting || isTogglingHidden}
              onClick={() => {
                setIsEditing((prev) => !prev);
                setError(null);
              }}
              className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={isDeleting || isTogglingHidden}
              onClick={handleToggleHidden}
              className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTogglingHidden ? "숨김 중..." : "숨김"}
            </button>
            <button
              type="button"
              disabled={isDeleting || isTogglingHidden}
              onClick={handleDelete}
              className="rounded-md border px-3 py-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
          <PostEditor
            mode="edit"
            postId={notice.id}
            initialTitle={notice.title}
            initialContent={notice.content}
            initialCategoryName={notice.categoryName}
            initialThumbnail={notice.thumbnail}
            initialIsBanner={notice.isBanner}
            initialIsSecret={notice.isSecret}
            initialIsResolved={notice.isResolved}
            categoryLocked
            fixedTagOptions={["FAQ"]}
            showBannerOption={notice.canManageBanner}
            allowNoticeBannerForAllCategories={notice.canManageBanner}
            onCancel={() => {
              setIsEditing(false);
              setError(null);
            }}
            onSuccess={() => {
              setIsEditing(false);
              setError(null);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <div
          className={
            notice.isOwner
              ? "flex flex-col items-start gap-4 md:flex-row md:justify-between"
              : ""
          }
        >
          <MarkdownRenderer
            content={notice.content}
            className="flex-1 [&_blockquote:first-child]:mt-0 [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_ol:first-child]:mt-0 [&_p:first-child]:mt-0 [&_pre:first-child]:mt-0 [&_table:first-child]:mt-0 [&_ul:first-child]:mt-0"
          />
          {notice.isOwner ? (
            <div className="flex shrink-0 flex-wrap items-start justify-end gap-2 self-start text-sm">
              <button
                type="button"
                disabled={isDeleting || isTogglingHidden}
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setError(null);
                }}
                className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                수정
              </button>
              <button
                type="button"
                disabled={isDeleting || isTogglingHidden}
                onClick={handleToggleHidden}
                className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTogglingHidden ? "숨김 중..." : "숨김"}
              </button>
              <button
                type="button"
                disabled={isDeleting || isTogglingHidden}
                onClick={handleDelete}
                className="rounded-md border px-3 py-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
