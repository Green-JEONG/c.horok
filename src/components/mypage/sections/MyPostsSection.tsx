"use client";

import PostListInfinite from "@/components/posts/PostListInfinite";

export default function MyPostsSection() {
  return (
    <section className="space-y-4" id="mypage-posts">
      <h2 className="text-lg font-semibold">내가 쓴 글</h2>
      <PostListInfinite
        initialPosts={[]}
        endpoint="/api/mypage/posts"
        autoloadFirstPage
        emptyMessage="작성한 글이 없습니다."
        gridClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
      />
    </section>
  );
}
