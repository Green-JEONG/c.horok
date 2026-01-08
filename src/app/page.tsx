import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horok Tech",
  description: "홈 페이지",
};

import { Suspense } from "react";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import PostListHeader from "@/components/posts/PostListHeader";
import PostList from "@/components/posts/PostList";

export default async function Page() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <ContributionGrid />
        <PostListHeader />
      </Suspense>
      <PostList />
    </div>
  );
}
