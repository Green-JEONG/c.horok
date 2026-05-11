import { parseSortType } from "@/lib/post-sort";
import PostListInfinite from "./PostListInfinite";

export default async function PostList({ sort }: { sort?: string }) {
  const parsedSort = parseSortType(sort);

  return (
    <PostListInfinite
      initialPosts={[]}
      endpoint="/api/posts"
      initialSort={parsedSort}
      syncSortWithSearchParams
      autoloadFirstPage
      responsiveRowLoading
      gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    />
  );
}
