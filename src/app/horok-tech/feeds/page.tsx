import type { Metadata } from "next";
import { Suspense } from "react";
import PostList from "@/components/posts/PostList";
import PostListHeader from "@/components/posts/PostListHeader";
import { countFeedPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feeds | c.horok",
  description: "피드 페이지",
  alternates: {
    canonical: "/horok-tech/feeds",
  },
};

export default async function HorokTechFeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const postCount = await countFeedPosts();

  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <PostListHeader
          titleAction={
            <span className="text-sm font-medium text-muted-foreground">
              {postCount}
            </span>
          }
        />
      </Suspense>
      <PostList sort={sort} />
    </div>
  );
}
