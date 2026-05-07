import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findPostsPaged } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import PostListInfinite from "./PostListInfinite";

export default async function PostList({ sort }: { sort?: string }) {
  const parsedSort = parseSortType(sort);
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const initialPosts = await findPostsPaged(12, 0, parsedSort, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });

  return (
    <PostListInfinite
      initialPosts={initialPosts}
      endpoint="/api/posts"
      initialSort={parsedSort}
      syncSortWithSearchParams
      gridClassName="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4"
    />
  );
}
