"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import {
  createPostThumbnailPath,
  getStorageObjectPathFromPublicUrl,
} from "@/lib/post-thumbnails";
import { supabase } from "@/lib/supabase";

export default function PostEditor() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeThumbnailFromStorage(path?: string | null) {
    if (!path) return;
    await supabase.storage.from("post-thumbnails").remove([path]);
  }

  async function handleThumbnailChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setError(null);

    try {
      if (thumbnailPath) {
        await removeThumbnailFromStorage(thumbnailPath);
      }

      const nextPath = createPostThumbnailPath(file.name);
      const { error: uploadError } = await supabase.storage
        .from("post-thumbnails")
        .upload(nextPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-thumbnails").getPublicUrl(nextPath);

      setThumbnailPath(nextPath);
      setThumbnailUrl(publicUrl);
      event.target.value = "";
    } catch {
      setError("썸네일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  async function handleThumbnailRemove() {
    const path =
      thumbnailPath ?? getStorageObjectPathFromPublicUrl(thumbnailUrl);

    try {
      await removeThumbnailFromStorage(path);
      setThumbnailPath(null);
      setThumbnailUrl(null);
      setError(null);
    } catch {
      setError("썸네일 삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const categoryName = tags
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .find(Boolean);

    if (!trimmedTitle || !trimmedContent || !categoryName) {
      setError("제목, 태그, 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          categoryName,
          thumbnailUrl,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 저장에 실패했습니다.");
        return;
      }

      if (payload?.id) {
        router.push(`/posts/${payload.id}`);
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("게시글 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full border-b px-1 py-2 text-xl font-semibold outline-none placeholder:text-muted-foreground"
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 입력 (#React 또는 React, 첫 번째 태그가 카테고리로 저장됩니다)"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">썸네일 이미지</p>
            <p className="text-xs text-muted-foreground">
              업로드한 이미지는 카드와 본문 상단에 함께 표시됩니다.
            </p>
          </div>
          <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
            {isUploadingThumbnail ? "업로드 중..." : "사진 업로드"}
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingThumbnail || isSubmitting}
              onChange={handleThumbnailChange}
              className="hidden"
            />
          </label>
        </div>

        {thumbnailUrl ? (
          <div className="space-y-3">
            <div className="relative h-52 overflow-hidden rounded-lg border bg-muted">
              <Image
                src={thumbnailUrl}
                alt="썸네일 미리보기"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isUploadingThumbnail || isSubmitting}
                onClick={handleThumbnailRemove}
                className="rounded-md border px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                사진 삭제
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          "글을 작성해보세요...\n\n# 제목\n## 소제목\n- 목록\n```ts\nconst hello = 'markdown';\n```"
        }
        rows={14}
        className="w-full resize-none rounded-md border px-3 py-3 text-sm leading-relaxed"
      />
      <p className="text-xs text-muted-foreground">
        마크다운 문법을 사용할 수 있습니다. 예: <code># 제목</code>,{" "}
        <code>**굵게**</code>, <code>- 목록</code>, <code>```코드```</code>
      </p>

      <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">미리보기</h2>
          <span className="text-xs text-muted-foreground">
            게시글 상세 페이지와 같은 방식으로 렌더링됩니다.
          </span>
        </div>
        {content.trim() ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="text-sm text-muted-foreground">
            본문을 입력하면 여기에 마크다운 결과가 표시됩니다.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          disabled={isSubmitting || isUploadingThumbnail}
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          취소
        </button>

        <button
          type="button"
          disabled={isSubmitting || isUploadingThumbnail}
          onClick={handleSubmit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "게시 중..."
            : isUploadingThumbnail
              ? "업로드 중..."
              : "게시하기"}
        </button>
      </div>
    </section>
  );
}
