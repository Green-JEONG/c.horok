import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 결과 | c.horok",
  description: "게시글 검색 결과 페이지",
};

import PostListInfinite from "@/components/posts/PostListInfinite";
import { parseSortType } from "@/lib/post-sort";
import { getPostsByCategorySlug, searchPosts } from "@/lib/queries";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, category, sort } = await searchParams;
  const categorySlug = category?.trim();
  const keyword = q?.trim();
  const parsedSort = parseSortType(sort);

  if (!keyword && !categorySlug) {
    return (
      <p className="text-sm text-muted-foreground">검색어를 입력해주세요.</p>
    );
  }

  if (categorySlug) {
    const { categoryName, posts } = await getPostsByCategorySlug(
      categorySlug,
      12,
      0,
      parsedSort,
    );

    if (!categoryName) {
      return (
        <p className="text-sm text-muted-foreground">
          선택한 카테고리를 찾을 수 없습니다.
        </p>
      );
    }

    if (posts.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          “#{categoryName}”에 대한 게시글이 없습니다.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold">#{categoryName}</h2>

        <PostListInfinite
          initialPosts={posts}
          endpoint={`/api/categories/${categorySlug}/posts`}
          initialSort={parsedSort}
          responseKey="posts"
          syncSortWithSearchParams
          emptyMessage={`“#${categoryName}”에 대한 게시글이 없습니다.`}
        />
      </div>
    );
  }

  const posts = await searchPosts(keyword ?? "", 12, 0, parsedSort);

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        “{keyword}”에 대한 검색 결과가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">{keyword}</h2>

      <PostListInfinite
        initialPosts={posts}
        endpoint={`/api/search?q=${encodeURIComponent(keyword ?? "")}`}
        initialSort={parsedSort}
        syncSortWithSearchParams
        emptyMessage={`“${keyword}”에 대한 검색 결과가 없습니다.`}
      />
    </div>
  );
}
