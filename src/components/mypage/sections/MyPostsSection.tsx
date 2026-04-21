"use client";

import { useEffect, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import PostCard from "@/components/posts/PostCard";

const PAGE_SIZE = 12;

type MyPost = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date | string;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
};

export default function MyPostsSection() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/mypage/posts?page=${page}`);
        const data: MyPost[] = await response.json();

        if (cancelled) return;

        setPosts(Array.isArray(data) ? data : []);
        setHasNextPage(Array.isArray(data) && data.length >= PAGE_SIZE);
      } catch {
        if (cancelled) return;
        setPosts([]);
        setHasNextPage(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = hasNextPage ? page + 1 : page;

  return (
    <section className="space-y-4" id="mypage-posts">
      <h2 className="text-lg font-semibold">내가 쓴 글</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">작성한 글이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                createdAt={new Date(post.created_at)}
                isHidden={post.is_hidden}
              />
            ))}
          </div>
          <SectionPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
