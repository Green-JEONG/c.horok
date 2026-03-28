import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import { getUserPosts } from "@/lib/queries";

type Props = {
  sort?: string;
  userId?: number;
  emptyMessage?: string;
  unauthenticatedMessage?: string;
};

export default async function MyPostList({
  sort,
  userId: initialUserId,
  emptyMessage = "아직 작성한 게시글이 없습니다.",
  unauthenticatedMessage = "로그인 후 내가 작성한 게시글을 볼 수 있습니다.",
}: Props) {
  const session = await auth();
  let userId = initialUserId ?? null;

  if (!userId) {
    if (!session?.user?.email) {
      return (
        <div className="text-sm text-muted-foreground">
          {unauthenticatedMessage}
        </div>
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

  const posts = await getUserPosts(userId, parseSortType(sort));

  if (posts.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <PostListInfinite
      initialPosts={posts}
      endpoint="/api/mypage/posts"
      initialSort={parsedSort}
      syncSortWithSearchParams
      gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3"
      emptyMessage="아직 작성한 게시글이 없습니다."
    />
  );
}
