import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Horok Tech",
  description: "홈페이지",
};

import { Suspense } from "react";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import PostList from "@/components/posts/PostList";
import PostListHeader from "@/components/posts/PostListHeader";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;

  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <ContributionGrid />
        <PostListHeader />
      </Suspense>
      <PostList sort={sort} />
    </div>
  );
}
