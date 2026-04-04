import { Suspense } from "react";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostCard from "@/components/posts/PostCard";
import PostListHeader from "@/components/posts/PostListHeader";
import { getRandomPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const randomPosts = await getRandomPosts(6);

  const randomPostsSection =
    randomPosts.length > 0 ? (
      <section className="space-y-3 mt-15">
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
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <ContributionGrid />
        <PostListHeader />
      </Suspense>
      <MyPostList
        sort={sort}
        emptyState={emptyState}
        unauthenticatedState={unauthenticatedState}
      />
    </div>
  );
}
