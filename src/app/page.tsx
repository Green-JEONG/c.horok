import Link from "next/link";

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
  const { sort } = await searchParams;
  const unauthenticatedState = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        로그인 후 게시글을 볼 수 있습니다.
      </p>
      <p className="text-sm text-muted-foreground">
        지금은 피드에서 최신 글을 먼저 둘러보실 수 있습니다.
      </p>
      <Link
        href="/feed"
        className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        피드 보러 가기
      </Link>
    </div>
  );
  const emptyState = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        아직 작성한 게시글이 없습니다.
      </p>
      <p className="text-sm text-muted-foreground">
        지금은 피드에서 최신 글을 먼저 둘러보실 수 있습니다.
      </p>
      <Link
        href="/feed"
        className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        피드 보러 가기
      </Link>
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
