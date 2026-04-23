"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import PostEditor from "@/components/posts/PostEditor";
import {
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
  redirectPath?: string;
  categoryLocked?: boolean;
  fixedTagOptions?: string[];
  children?: ReactNode;
};

export default function PostActions({
  postId,
  initialTitle,
  initialContent,
  initialCategoryName,
  initialThumbnail,
  initialIsHidden,
  isOwner,
  redirectPath = "/horok-tech/feeds",
  categoryLocked = false,
  fixedTagOptions,
  children,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHidden, setIsHidden] = useState(initialIsHidden);
  const [isTogglingHidden, setIsTogglingHidden] = useState(false);

  if (!isOwner) {
    return children ?? null;
  }

  async function removeThumbnailFromStorage(path?: string | null) {
    if (!path) return;
    await supabase.storage.from(POST_THUMBNAIL_BUCKET).remove([path]);
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

      const storagePath = getStorageObjectPathFromPublicUrl(initialThumbnail);
      if (storagePath) {
        await removeThumbnailFromStorage(storagePath);
      }

      router.push(redirectPath);
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
          disabled={isDeleting || isTogglingHidden}
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
          disabled={isDeleting || isTogglingHidden}
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
          disabled={isDeleting || isTogglingHidden}
          onClick={handleDelete}
          className="rounded-md border px-3 py-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "삭제 중..." : "삭제"}
        </button>
      </div>

      {isEditing ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <PostEditor
            mode="edit"
            postId={postId}
            initialTitle={initialTitle}
            initialContent={initialContent}
            initialCategoryName={initialCategoryName}
            initialThumbnail={initialThumbnail}
            categoryLocked={categoryLocked}
            fixedTagOptions={fixedTagOptions}
            onCancel={() => {
              setIsEditing(false);
              setError(null);
            }}
            onSuccess={() => {
              setIsEditing(false);
              setError(null);
            }}
          />
        </div>
      ) : (
        children
      )}

      {!isEditing && error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
