import type { Metadata } from "next";

import { auth } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostListHeader from "@/components/posts/PostListHeader";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const { sort } = await searchParams;

  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <ContributionGrid />
        <PostListHeader />
      </Suspense>
      {session?.user?.email ? (
        <MyPostList sort={sort} />
      ) : (
        <div className="text-sm text-muted-foreground">
          로그인 후 게시글을 볼 수 있습니다.
        </div>
      )}
    </div>
  );
}
