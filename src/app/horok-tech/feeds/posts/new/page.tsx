import type { Metadata } from "next";
import PostEditor from "@/components/posts/PostEditor";

export const metadata: Metadata = {
  title: "New Post | c.horok",
  description: "글 작성 페이지",
};

export default function HorokTechWritePostPage() {
  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">글 작성</h1>
      <PostEditor />
    </main>
  );
}
