import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Post | c.horok",
  description: "글 작성 페이지",
};

import PostEditor from "@/components/posts/PostEditor";

export default function WritePostPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">글 작성</h1>
      <PostEditor />
    </main>
  );
}
