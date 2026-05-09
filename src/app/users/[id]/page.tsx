import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostListHeader from "@/components/posts/PostListHeader";
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

  const postCount = await countUserPosts(Number(id), {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    query: q,
    categorySlug: category,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">{user.name ?? "이 유저"}님의 홈</h1>
      <ContributionGrid userId={Number(id)} />
      <PostListHeader
        title="작성한 글"
        showWriteButton={false}
        titleAction={
          <span className="text-sm font-medium text-muted-foreground">
            {postCount}
          </span>
        }
        searchPlaceholder={`${user.name ?? "이 유저"}님의 글 검색`}
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
