import { findPostsPaged } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import PostListInfinite from "./PostListInfinite";

export default async function PostList({ sort }: { sort?: string }) {
  const parsedSort = parseSortType(sort);
  const initialPosts = await findPostsPaged(12, 0, parsedSort);

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
