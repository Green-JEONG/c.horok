"use client";

import { useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import PostCard from "./PostCard";

const PAGE_SIZE = 12;

type PostItem = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date | string;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
  is_secret?: boolean;
  can_view_secret?: boolean;
};

export default function PostGridPagination({ posts }: { posts: PostItem[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagedPosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3">
        {pagedPosts.map((post) => (
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
            isSecret={post.is_secret}
            canViewSecret={post.can_view_secret}
          />
        ))}
      </div>

      <SectionPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
