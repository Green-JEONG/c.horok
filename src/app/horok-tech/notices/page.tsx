import type { Metadata } from "next";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import PostListHeader from "@/components/posts/PostListHeader";
import PostListInfinite from "@/components/posts/PostListInfinite";
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
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const parsedSort = parseSortType(sort);
  const session = await auth();
  const notices = await findNotices(parsedSort);
  const initialNotices = notices.slice(0, 12);

  return (
    <section className="space-y-4">
      <PostListHeader
        title="공지사항"
        showWriteButton={session?.user?.role === "ADMIN"}
        writeButtonHref="/horok-tech/notices/new"
        writeButtonLabel="공지 작성"
      />

      {notices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 등록된 공지사항이 없습니다.
        </p>
      ) : null}

      <PostListInfinite
        initialPosts={initialNotices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          content: notice.summary,
          thumbnail: null,
          created_at: notice.publishedAt,
          author_name: "horok-tech",
          category_name: notice.categoryName,
          likes_count: notice.likesCount,
          comments_count: notice.commentsCount,
          view_count: notice.viewCount,
          updated_at: notice.publishedAt,
        }))}
        endpoint={`/api/notices?sort=${encodeURIComponent(parsedSort)}`}
        gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4"
        emptyMessage="아직 등록된 공지사항이 없습니다."
        loadingMessage="공지사항을 불러오는 중..."
      />
    </section>
  );
}
