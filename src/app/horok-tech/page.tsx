import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostCard from "@/components/posts/PostCard";
import PostListHeader from "@/components/posts/PostListHeader";
import { Button } from "@/components/ui/button";
import { getRandomPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "호록 기술 블로그 | horok-tech",
  description: "호록 기술 블로그 메인 페이지",
  alternates: {
    canonical: "/horok-tech",
  },
};

export default async function HorokTechPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const randomPosts = await getRandomPosts(6, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });

  const randomPostsSection =
    randomPosts.length > 0 ? (
      <section className="mt-15 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">맛보기</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3">
          {randomPosts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.content}
              thumbnail={post.thumbnail}
              category={post.category_name}
              author={post.author_name}
              likes={post.likes_count}
              comments={post.comments_count}
              createdAt={post.created_at}
            />
          ))}
        </div>
      </section>
    ) : null;

  const unauthenticatedState = (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        로그인 후 게시글을 볼 수 있습니다.
      </p>
      {randomPostsSection}
    </div>
  );
  const emptyState = (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        아직 작성한 게시글이 없습니다.
      </p>
      {randomPostsSection}
    </div>
  );

  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="h-6 w-32 animate-pulse rounded bg-muted" />}
      >
        <ContributionGrid />
        <PostListHeader
          titleAction={
            session?.user ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/mypage?tab=posts">더보기</Link>
              </Button>
            ) : null
          }
        />
      </Suspense>
      <MyPostList
        sort={sort}
        limit={6}
        emptyState={emptyState}
        unauthenticatedState={unauthenticatedState}
      />
    </div>
  );
}
