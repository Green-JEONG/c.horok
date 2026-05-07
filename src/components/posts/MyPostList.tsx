import type { ReactNode } from "react";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import { getUserPosts } from "@/lib/queries";
import PostCard from "./PostCard";
import PostGridPagination from "./PostGridPagination";

type Props = {
  sort?: string;
  userId?: number;
  limit?: number;
  emptyMessage?: string;
  unauthenticatedMessage?: string;
  emptyState?: ReactNode;
  unauthenticatedState?: ReactNode;
};

export default async function MyPostList({
  sort,
  userId: initialUserId,
  limit,
  emptyMessage = "아직 작성한 게시글이 없습니다.",
  unauthenticatedMessage = "로그인 후 내가 작성한 게시글을 볼 수 있습니다.",
  emptyState,
  unauthenticatedState,
}: Props) {
  const session = await auth();
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
    isAdmin: session?.user?.role === "ADMIN",
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
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3">
        {limitedPosts.map((post) => (
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
            createdAt={new Date(post.created_at)}
            isHidden={post.is_hidden}
            isSecret={post.is_secret}
            canViewSecret={post.can_view_secret}
          />
        ))}
      </div>
    );
  }

  return <PostGridPagination posts={posts} />;
}
