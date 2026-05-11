import type { ReactNode } from "react";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import { getUserPosts } from "@/lib/queries";
import MyPostPreviewGrid from "./MyPostPreviewGrid";
import PostGridPagination from "./PostGridPagination";
import PostListInfinite from "./PostListInfinite";

type Props = {
  sort?: string;
  query?: string;
  searchTarget?: string;
  categorySlug?: string;
  userId?: number;
  limit?: number;
  infiniteEndpoint?: string;
  emptyMessage?: string;
  unauthenticatedMessage?: string;
  emptyState?: ReactNode;
  unauthenticatedState?: ReactNode;
};

export default async function MyPostList({
  sort,
  query,
  searchTarget,
  categorySlug,
  userId: initialUserId,
  limit,
  infiniteEndpoint,
  emptyMessage = "아직 작성한 게시글이 없습니다.",
  unauthenticatedMessage = "로그인 후 내가 작성한 게시글을 볼 수 있습니다.",
  emptyState,
  unauthenticatedState,
}: Props) {
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  let userId = initialUserId ?? null;

  if (!userId) {
    if (!session?.user?.email) {
      return (
        unauthenticatedState ?? (
          <div className="text-sm text-muted-foreground">
            {unauthenticatedMessage}
          </div>
        )
      );
    }

    userId = await getUserIdByEmail(session.user.email);
  }

  if (!userId) {
    return (
      <div className="text-sm text-muted-foreground">
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const posts = await getUserPosts(userId, parseSortType(sort), undefined, 0, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
    query,
    searchTarget: parsePostSearchTarget(searchTarget),
    categorySlug,
  });
  const limitedPosts =
    typeof limit === "number" ? posts.slice(0, limit) : posts;

  if (posts.length === 0) {
    return (
      emptyState ?? (
        <div className="text-sm text-muted-foreground">{emptyMessage}</div>
      )
    );
  }

  if (typeof limit === "number") {
    return <MyPostPreviewGrid posts={limitedPosts} limit={limit} />;
  }

  if (infiniteEndpoint) {
    return (
      <PostListInfinite
        initialPosts={posts.slice(0, 12)}
        endpoint={infiniteEndpoint}
        initialSort={parseSortType(sort)}
        syncSortWithSearchParams
        gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
    );
  }

  return <PostGridPagination posts={posts} />;
}
