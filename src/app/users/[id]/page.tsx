import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostListHeader from "@/components/posts/PostListHeader";
import { getCategoryBySlug } from "@/lib/categories";
import { findUserById } from "@/lib/db";
import { countUserPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; q?: string; category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return {
      title: "유저 페이지 | c.horok",
    };
  }

  const user = await findUserById(id);

  return {
    title: `${user?.name ?? "유저"} | c.horok`,
    description: `${user?.name ?? "유저"}의 잔디와 작성한 글`,
  };
}

export default async function UserPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { sort, q, category } = await searchParams;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;

  if (viewerUserId === Number(id)) {
    redirect("/mypage");
  }

  const user = await findUserById(id);

  if (!user) {
    notFound();
  }

  const [postCount, selectedCategory] = await Promise.all([
    countUserPosts(Number(id), {
      viewerUserId:
        typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
          ? viewerUserId
          : null,
      query: q,
      categorySlug: category,
    }),
    category?.trim() ? getCategoryBySlug(category.trim()) : null,
  ]);
  const displayName = user.name ?? "이 유저";

  return (
    <div className="space-y-6">
      {selectedCategory ? (
        <h1 className="inline-flex min-w-0 items-center gap-1 text-lg font-semibold">
          <span className="truncate">{displayName}님의 홈</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="shrink-0">카테고리</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selectedCategory.name}</span>
        </h1>
      ) : (
        <h1 className="text-lg font-semibold">{displayName}님의 홈</h1>
      )}
      {selectedCategory ? null : <ContributionGrid userId={Number(id)} />}
      <PostListHeader
        title={selectedCategory ? "게시물" : "작성한 글"}
        showWriteButton={false}
        titleAction={
          <span className="text-sm font-medium text-muted-foreground">
            {postCount}
          </span>
        }
        searchPlaceholder={
          selectedCategory ? undefined : `${user.name ?? "이 유저"}님의 글 검색`
        }
      />
      <MyPostList
        sort={sort}
        query={q}
        categorySlug={category}
        userId={Number(id)}
        infiniteEndpoint={`/api/users/${id}/posts`}
        emptyMessage="아직 작성한 게시글이 없습니다."
      />
    </div>
  );
}
