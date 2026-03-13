import { findPostsPaged } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";
import PostListInfinite from "./PostListInfinite";

export default async function PostList({ sort }: { sort?: string }) {
  const parsedSort = parseSortType(sort);
  const initialPosts = await findPostsPaged(12, 0, parsedSort);

  return (
    <PostListInfinite initialPosts={initialPosts} initialSort={parsedSort} />
  );
}
