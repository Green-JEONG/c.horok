// MyPostsSection.tsx
"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/posts/PostCard";

type Post = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  category_name: string;
  author_name: string;
  created_at: string; // ← JSON이라 string
  likes_count: number;
  comments_count: number;
};

export default function MyPostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mypage/posts")
      .then((res) => res.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">작성한 글이 없습니다.</p>
    );
  }

  return (
    <section className="space-y-4" id="mypage-posts">
      <h2 className="text-lg font-semibold">내가 쓴 글</h2>

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
          />
        ))}
      </div>
    </section>
  );
}
