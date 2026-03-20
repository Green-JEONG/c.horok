import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 결과 | c.horok",
  description: "게시글 검색 결과 페이지",
};

import PostCard from "@/components/posts/PostCard";
import { searchPosts } from "@/lib/queries";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const keyword = q?.trim();

  if (!keyword) {
    return (
      <p className="text-sm text-muted-foreground">검색어를 입력해주세요.</p>
    );
  }

  const posts = await searchPosts(keyword, 12, 0);

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
    </div>
  );
}
