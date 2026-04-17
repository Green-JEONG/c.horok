"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import {
  createPostContentImagePath,
  createPostThumbnailPath,
  getStorageObjectPathFromPublicUrl,
  POST_THUMBNAIL_BUCKET,
} from "@/lib/post-thumbnails";
import { supabase } from "@/lib/supabase";

type Props = {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialCategoryName: string;
  initialThumbnail: string | null;
  initialIsHidden: boolean;
  isOwner: boolean;
};

export default function PostActions({
  postId,
  initialTitle,
  initialContent,
  initialCategoryName,
  initialThumbnail,
  initialIsHidden,
  isOwner,
}: Props) {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [savedCategoryName, setSavedCategoryName] =
    useState(initialCategoryName);
  const [savedThumbnailUrl, setSavedThumbnailUrl] = useState(initialThumbnail);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnail);
  const [thumbnailPath, setThumbnailPath] = useState(
    getStorageObjectPathFromPublicUrl(initialThumbnail),
  );
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingContentImage, setIsUploadingContentImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHidden, setIsHidden] = useState(initialIsHidden);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);

  if (!isOwner) return null;

  async function removeThumbnailFromStorage(path?: string | null) {
    if (!path) return;
    await supabase.storage.from(POST_THUMBNAIL_BUCKET).remove([path]);
  }

  function insertTextAtCursor(text: string) {
    const textarea = contentRef.current;

    if (!textarea) {
      setContent((prev) => `${prev}${prev ? "\n\n" : ""}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n\n" : "";
    const nextContent = `${before}${prefix}${text}${suffix}${after}`;
    const nextCursorPosition = (before + prefix + text).length;

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  async function handleThumbnailChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setError(null);

    try {
      const nextPath = createPostThumbnailPath(file.name);
      const { error: uploadError } = await supabase.storage
        .from(POST_THUMBNAIL_BUCKET)
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
      } = supabase.storage.from(POST_THUMBNAIL_BUCKET).getPublicUrl(nextPath);

      const previousUnsavedPath =
        thumbnailPath && thumbnailUrl !== savedThumbnailUrl
          ? thumbnailPath
          : null;

      if (previousUnsavedPath && previousUnsavedPath !== nextPath) {
        await removeThumbnailFromStorage(previousUnsavedPath);
      }

      setThumbnailPath(nextPath);
      setThumbnailUrl(publicUrl);
      event.target.value = "";
    } catch {
      setError("썸네일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingThumbnail(false);
    }
  }

  async function handleContentImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setIsUploadingContentImage(true);
    setError(null);

    try {
      const markdownImages: string[] = [];

      for (const file of files) {
        const nextPath = createPostContentImagePath(file.name);
        const { error: uploadError } = await supabase.storage
          .from(POST_THUMBNAIL_BUCKET)
          .upload(nextPath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(POST_THUMBNAIL_BUCKET).getPublicUrl(nextPath);

        markdownImages.push(`![${file.name}](${publicUrl})`);
      }

      insertTextAtCursor(markdownImages.join("\n\n"));
      event.target.value = "";
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "본문 이미지 업로드 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsUploadingContentImage(false);
    }
  }

  async function handleThumbnailRemove() {
    try {
      if (thumbnailPath && thumbnailUrl !== savedThumbnailUrl) {
        await removeThumbnailFromStorage(thumbnailPath);
      }

      setThumbnailUrl(null);
      setThumbnailPath(null);
      setError(null);
    } catch {
      setError("썸네일 삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleUpdate() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedCategoryName = categoryName.trim().replace(/^#/, "");

    if (!trimmedTitle || !trimmedContent || !trimmedCategoryName) {
      setError("제목, 태그, 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          categoryName: trimmedCategoryName,
          thumbnailUrl,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 수정에 실패했습니다.");
        return;
      }

      const oldSavedThumbnailPath =
        savedThumbnailUrl && savedThumbnailUrl !== thumbnailUrl
          ? getStorageObjectPathFromPublicUrl(savedThumbnailUrl)
          : null;

      if (oldSavedThumbnailPath) {
        await removeThumbnailFromStorage(oldSavedThumbnailPath);
      }

      setSavedTitle(trimmedTitle);
      setSavedContent(trimmedContent);
      setSavedCategoryName(trimmedCategoryName);
      setSavedThumbnailUrl(thumbnailUrl);
      setTitle(trimmedTitle);
      setContent(trimmedContent);
      setCategoryName(trimmedCategoryName);
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("이 게시글을 삭제할까요?");
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 삭제에 실패했습니다.");
        return;
      }

      const storagePath = getStorageObjectPathFromPublicUrl(savedThumbnailUrl);
      if (storagePath) {
        await removeThumbnailFromStorage(storagePath);
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleHidden() {
    const nextHidden = !isHidden;
    const confirmed = window.confirm(
      nextHidden
        ? "이 게시글을 숨김 처리할까요? 숨김 처리하면 다른 사용자는 볼 수 없습니다."
        : "이 게시글을 다시 공개할까요?",
    );
    if (!confirmed) return;

    setIsTogglingHidden(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHidden: nextHidden }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "게시글 숨김 상태 변경에 실패했습니다.");
        return;
      }

      setIsHidden(nextHidden);
      router.refresh();
    } catch {
      setError("게시글 숨김 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsTogglingHidden(false);
    }
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex justify-end gap-2 text-sm">
        <button
          type="button"
          disabled={
            isSubmitting ||
            isDeleting ||
            isTogglingHidden ||
            isUploadingThumbnail ||
            isUploadingContentImage
          }
          onClick={() => {
            setIsEditing((prev) => !prev);
            setError(null);
          }}
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEditing ? "닫기" : "수정"}
        </button>

        <button
          type="button"
          disabled={
            isSubmitting ||
            isDeleting ||
            isTogglingHidden ||
            isUploadingThumbnail ||
            isUploadingContentImage
          }
          onClick={handleToggleHidden}
          className="rounded-md border px-3 py-1 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isTogglingHidden
            ? isHidden
              ? "공개 중..."
              : "숨김 중..."
            : isHidden
              ? "숨김 해제"
              : "숨김"}
        </button>

        <button
          type="button"
          disabled={
            isSubmitting ||
            isDeleting ||
            isTogglingHidden ||
            isUploadingThumbnail ||
            isUploadingContentImage
          }
          onClick={handleDelete}
          className="rounded-md border px-3 py-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "삭제 중..." : "삭제"}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="태그"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            ref={contentRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            placeholder={
              "내용\n\n# 제목\n## 소제목\n- 목록\n![이미지 설명](https://...)\n```ts\nconst hello = 'markdown';\n```"
            }
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            마크다운 문법을 사용할 수 있습니다. 예: <code># 제목</code>,{" "}
            <code>**굵게**</code>, <code>- 목록</code>, <code>```코드```</code>
          </p>

          <div className="space-y-3 rounded-xl border border-dashed p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">본문 이미지</p>
                <p className="text-xs text-muted-foreground">
                  여러 장을 올리면 현재 커서 위치에 마크다운 이미지가
                  삽입됩니다.
                </p>
              </div>
              <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                {isUploadingContentImage ? "업로드 중..." : "본문 사진 추가"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    isSubmitting ||
                    isTogglingHidden ||
                    isUploadingThumbnail ||
                    isUploadingContentImage
                  }
                  onChange={handleContentImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">미리보기</h3>
              <span className="text-xs text-muted-foreground">
                저장 후 본문에 표시될 결과입니다.
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

          <div className="space-y-3 rounded-xl border border-dashed p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">썸네일 이미지</p>
                <p className="text-xs text-muted-foreground">
                  새 이미지를 올리거나 기존 이미지를 제거할 수 있습니다.
                </p>
              </div>
              <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                {isUploadingThumbnail ? "업로드 중..." : "사진 업로드"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={
                    isSubmitting ||
                    isTogglingHidden ||
                    isUploadingThumbnail ||
                    isUploadingContentImage
                  }
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
                    disabled={
                      isSubmitting ||
                      isTogglingHidden ||
                      isUploadingThumbnail ||
                      isUploadingContentImage
                    }
                    onClick={handleThumbnailRemove}
                    className="rounded-md border px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    사진 삭제
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={
                isSubmitting ||
                isTogglingHidden ||
                isUploadingThumbnail ||
                isUploadingContentImage
              }
              onClick={async () => {
                if (thumbnailPath && thumbnailUrl !== savedThumbnailUrl) {
                  await removeThumbnailFromStorage(thumbnailPath);
                }
                setTitle(savedTitle);
                setContent(savedContent);
                setCategoryName(savedCategoryName);
                setThumbnailUrl(savedThumbnailUrl);
                setThumbnailPath(
                  getStorageObjectPathFromPublicUrl(savedThumbnailUrl),
                );
                setIsEditing(false);
                setError(null);
              }}
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              disabled={
                isSubmitting ||
                isTogglingHidden ||
                isUploadingThumbnail ||
                isUploadingContentImage
              }
              onClick={handleUpdate}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "저장 중..."
                : isUploadingThumbnail || isUploadingContentImage
                  ? "업로드 중..."
                  : "수정 저장"}
            </button>
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
