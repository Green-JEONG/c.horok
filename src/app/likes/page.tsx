import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Like | Horok Tech",
  description: "좋아요 페이지",
};

import { Suspense } from "react";
import PostListHeader from "@/components/posts/PostListHeader";
import LikedPostList from "@/components/posts/LikedPostList";

export default function LikesPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <PostListHeader />
      </Suspense>

      <LikedPostList />
    </div>
  );
}
