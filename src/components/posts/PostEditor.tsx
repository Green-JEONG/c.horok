"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostEditor() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  return (
    <section className="space-y-4">
      {/* 제목 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full border-b px-1 py-2 text-xl font-semibold outline-none placeholder:text-muted-foreground"
      />

      {/* 태그 */}
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표로 구분)"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {/* 본문 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="글을 작성해보세요..."
        rows={14}
        className="w-full resize-none rounded-md border px-3 py-3 text-sm leading-relaxed"
      />

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          취소
        </button>

        <button
          type="button"
          onClick={() => {
            // 👉 다음 단계: API 연결
            console.log({ title, content, tags });
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          게시하기
        </button>
      </div>
    </section>
  );
}
