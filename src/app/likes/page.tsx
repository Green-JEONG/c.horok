import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Like | Horok Tech",
  description: "좋아요 페이지",
};

import { Suspense } from "react";
import LikedPostList from "@/components/posts/LikedPostList";
import PostListHeader from "@/components/posts/PostListHeader";

export default async function LikesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;

  return (
    <div className="space-y-4">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <PostListHeader />
      </Suspense>

      <LikedPostList sort={sort} />
    </div>
  );
}
