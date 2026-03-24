import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import { getLikedPosts } from "@/lib/queries";
import PostListInfinite from "./PostListInfinite";

export default async function LikedPostList({ sort }: { sort?: string }) {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="text-sm text-muted-foreground">
        로그인 후 좋아요한 게시글을 볼 수 있습니다.
      </div>
    );
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    return (
      <div className="text-sm text-muted-foreground">
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const parsedSort = parseSortType(sort);
  const posts = await getLikedPosts(userId, parsedSort, 12, 0);

  if (posts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        아직 좋아요한 게시글이 없습니다.
      </div>
    );
  }

  return (
    <PostListInfinite
      initialPosts={posts}
      endpoint="/api/likes/posts"
      initialSort={parsedSort}
      syncSortWithSearchParams
      emptyMessage="아직 좋아요한 게시글이 없습니다."
    />
  );
}
