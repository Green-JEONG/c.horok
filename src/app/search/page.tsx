import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 결과 | c.horok",
  description: "게시글 검색 결과 페이지",
};

import PostCard from "@/components/posts/PostCard";
import { getPostsByCategorySlug, searchPosts } from "@/lib/queries";

type Props = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, category } = await searchParams;
  const categorySlug = category?.trim();
  const keyword = q?.trim();

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {posts.map((post) => (
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
              createdAt={post.created_at}
            />
          ))}
        </div>

        <p className="py-6 text-center text-xs text-muted-foreground">
          마지막 게시물입니다
        </p>
      </div>
    );
  }

  const posts = await searchPosts(keyword ?? "", 12, 0);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {posts.map((post) => (
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
            createdAt={post.created_at}
          />
        ))}
      </div>

      <p className="py-6 text-center text-xs text-muted-foreground">
        마지막 게시물입니다
      </p>
    </div>
  );
}
