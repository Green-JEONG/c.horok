"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createPostContentImagePath,
  createPostThumbnailPath,
  getStorageObjectPathFromPublicUrl,
  POST_THUMBNAIL_BUCKET,
} from "@/lib/post-thumbnails";
import { supabase } from "@/lib/supabase";

const markdownTools = [
  { label: "H1", action: "heading1" },
  { label: "H2", action: "heading2" },
  { label: "H3", action: "heading3" },
  { label: "H4", action: "heading4" },
  { label: "왼쪽", action: "alignLeft" },
  { label: "가운데", action: "alignCenter" },
  { label: "오른쪽", action: "alignRight" },
  { label: "굵게", action: "bold" },
  { label: "기울임", action: "italic" },
  { label: "취소선", action: "strike" },
  { label: "코드블록", action: "codeblock" },
  { label: "인용", action: "quote" },
  { label: "목록", action: "list" },
  { label: "번호목록", action: "orderedList" },
  { label: "체크", action: "checklist" },
  { label: "표", action: "table" },
  { label: "구분선", action: "divider" },
  { label: "링크", action: "link" },
  { label: "이미지", action: "image" },
  { label: "동영상", action: "video" },
] as const;

type MarkdownToolAction = (typeof markdownTools)[number]["action"];
type EditorTab = "thumbnail" | "write" | "preview";

export default function PostEditor() {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const contentVideoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingContentImage, setIsUploadingContentImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("write");
  const [error, setError] = useState<string | null>(null);

  async function removeThumbnailFromStorage(path?: string | null) {
    if (!path) return;
    await supabase.storage.from(POST_THUMBNAIL_BUCKET).remove([path]);
  }

  function normalizeTagValue(value: string) {
    return value.trim().replace(/^#/, "");
  }

  function addTag(rawValue: string) {
    const nextTag = normalizeTagValue(rawValue);
    if (!nextTag) return;

    setTags((prev) =>
      prev.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
        ? prev
        : [...prev, nextTag],
    );
    setTagInput("");
  }

  function removeTag(targetTag: string) {
    setTags((prev) => prev.filter((tag) => tag !== targetTag));

    requestAnimationFrame(() => {
      tagInputRef.current?.focus();
    });
  }

  function updateContentWithSelection(
    nextContent: string,
    selectionStart: number,
    selectionEnd = selectionStart,
  ) {
    setContent(nextContent);

    requestAnimationFrame(() => {
      const textarea = contentRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
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

    updateContentWithSelection(nextContent, nextCursorPosition);
  }

  function handleContentKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) return;

    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) return;

    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIndex = content.indexOf("\n", start);
    const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
    const currentLine = content.slice(lineStart, lineEnd);
    const orderedMatch = currentLine.match(/^(\d+)\.\s(.*)$/);

    if (!orderedMatch) return;

    event.preventDefault();

    const [, currentNumber, currentText] = orderedMatch;
    const before = content.slice(0, start);
    const after = content.slice(end);

    if (currentText.trim().length === 0) {
      const nextContent =
        content.slice(0, lineStart) +
        content.slice(lineStart + orderedMatch[0].length);
      updateContentWithSelection(nextContent, lineStart);
      return;
    }

    const nextNumber = Number(currentNumber) + 1;
    const insertedText = `\n${nextNumber}. `;
    const nextContent = `${before}${insertedText}${after}`;
    const nextCursorPosition = start + insertedText.length;

    updateContentWithSelection(nextContent, nextCursorPosition);
  }

  function wrapSelection(
    prefix: string,
    suffix = prefix,
    placeholder = "",
    selectWrapped = false,
  ) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end) || placeholder;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const nextContent = `${before}${prefix}${selectedText}${suffix}${after}`;
    const selectionFrom = start + prefix.length;
    const selectionTo = selectionFrom + selectedText.length;

    updateContentWithSelection(
      nextContent,
      selectWrapped ? selectionFrom : selectionTo + suffix.length,
      selectWrapped ? selectionTo : selectionTo + suffix.length,
    );
  }

  function wrapSelectedBlock(
    prefix: string,
    suffix: string,
    placeholder: string,
  ) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end) || placeholder;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const nextContent = `${before}${prefix}\n${selectedText}\n${suffix}${after}`;
    const selectionStart = start + prefix.length + 1;
    const selectionEnd = selectionStart + selectedText.length;

    updateContentWithSelection(nextContent, selectionStart, selectionEnd);
  }

  function prefixSelectedLines(prefix: string, placeholder: string) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIndex = content.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
    const selectedBlock = content.slice(lineStart, lineEnd) || placeholder;
    const nextBlock = selectedBlock
      .split("\n")
      .map((line) => `${prefix}${line || placeholder}`)
      .join("\n");
    const nextContent =
      content.slice(0, lineStart) + nextBlock + content.slice(lineEnd);

    updateContentWithSelection(
      nextContent,
      lineStart,
      lineStart + nextBlock.length,
    );
  }

  function applyMarkdownTool(action: MarkdownToolAction) {
    const textarea = contentRef.current;
    if (!textarea) return;

    switch (action) {
      case "heading1":
        prefixSelectedLines("# ", "제목");
        break;
      case "heading2":
        prefixSelectedLines("## ", "소제목");
        break;
      case "heading3":
        prefixSelectedLines("### ", "세부 제목");
        break;
      case "heading4":
        prefixSelectedLines("#### ", "작은 제목");
        break;
      case "alignLeft":
        wrapSelectedBlock("[left]", "[/left]", "정렬할 내용을 입력하세요");
        break;
      case "alignCenter":
        wrapSelectedBlock("[center]", "[/center]", "정렬할 내용을 입력하세요");
        break;
      case "alignRight":
        wrapSelectedBlock("[right]", "[/right]", "정렬할 내용을 입력하세요");
        break;
      case "bold":
        wrapSelection("**", "**", "굵게 표시할 내용", true);
        break;
      case "italic":
        wrapSelection("*", "*", "기울여 표시할 내용", true);
        break;
      case "strike":
        wrapSelection("~~", "~~", "취소선을 넣을 내용", true);
        break;
      case "codeblock":
        wrapSelection("```tsx\n", "\n```", "코드를 입력하세요", true);
        break;
      case "quote":
        prefixSelectedLines("> ", "인용문");
        break;
      case "list":
        prefixSelectedLines("- ", "목록 내용");
        break;
      case "orderedList":
        prefixSelectedLines("1. ", "순서 항목");
        break;
      case "checklist":
        prefixSelectedLines("- [ ] ", "체크할 내용");
        break;
      case "table":
        insertTextAtCursor(
          "| 항목 | 내용 |\n| --- | --- |\n| 예시 | 값을 입력하세요 |",
        );
        break;
      case "divider":
        insertTextAtCursor("---");
        break;
      case "link":
        wrapSelection("[", "](https://)", "링크 텍스트", true);
        break;
      case "image":
        contentImageInputRef.current?.click();
        break;
      case "video":
        contentVideoInputRef.current?.click();
        break;
    }
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

  async function handleContentVideoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setIsUploadingContentImage(true);
    setError(null);

    try {
      const markdownVideos: string[] = [];

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

        markdownVideos.push(`![video](${publicUrl})`);
      }

      insertTextAtCursor(markdownVideos.join("\n\n"));
      event.target.value = "";
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "본문 동영상 업로드 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsUploadingContentImage(false);
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
    const categoryName = tags[0];

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
    <section className="space-y-6">
      <div className="space-y-2 border-b border-border/70 pb-2">
        <input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border-0 bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-zinc-400 sm:text-4xl"
        />
      </div>

      <div className="space-y-2">
        <div className="flex min-h-12 w-full flex-wrap items-center gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 transition focus-within:border-primary/60 focus-within:bg-background focus-within:ring-4 focus-within:ring-primary/10">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label={`${tag} 태그 삭제`}
              >
                ×
              </button>
            </Badge>
          ))}
          <input
            id="post-tags"
            ref={tagInputRef}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(tagInput);
                return;
              }

              if (
                event.key === "Backspace" &&
                tagInput.length === 0 &&
                tags.length > 0
              ) {
                event.preventDefault();
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            placeholder={tags.length === 0 ? "태그 및 카테고리" : ""}
            className="h-8 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <input
          ref={contentImageInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={
            isUploadingThumbnail || isUploadingContentImage || isSubmitting
          }
          onChange={handleContentImageChange}
          className="hidden"
        />
        <input
          ref={contentVideoInputRef}
          type="file"
          accept="video/*"
          multiple
          disabled={
            isUploadingThumbnail || isUploadingContentImage || isSubmitting
          }
          onChange={handleContentVideoChange}
          className="hidden"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center border-b border-border/70">
            <button
              type="button"
              onClick={() => setActiveTab("thumbnail")}
              className={`w-20 border-b-2 px-1 pb-2 text-center text-sm font-medium transition ${
                activeTab === "thumbnail"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              썸네일
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`w-20 border-b-2 px-1 pb-2 text-center text-sm font-medium transition ${
                activeTab === "write"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              본문
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`w-20 border-b-2 px-1 pb-2 text-center text-sm font-medium transition ${
                activeTab === "preview"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              미리보기
            </button>
          </div>
        </div>

        {activeTab === "write" ? (
          <div className="flex flex-wrap gap-2">
            {markdownTools.map((tool) => (
              <button
                key={tool.action}
                type="button"
                onClick={() => applyMarkdownTool(tool.action)}
                className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                {tool.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="h-[420px] rounded-md border border-border/80 bg-muted/15">
          {activeTab === "thumbnail" ? (
            <div className="flex h-full flex-col px-5 py-5">
              <div className="flex-1">
                {thumbnailUrl ? (
                  <div className="relative h-full min-h-[300px] overflow-hidden rounded-md bg-muted">
                    <Image
                      src={thumbnailUrl}
                      alt="썸네일 미리보기"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[300px] items-center justify-center rounded-md border border-dashed border-border/80 bg-background/70">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        isUploadingThumbnail ||
                        isUploadingContentImage ||
                        isSubmitting
                      }
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      {isUploadingThumbnail ? "업로드 중..." : "사진 선택"}
                    </Button>
                  </div>
                )}
              </div>

              {thumbnailUrl ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isUploadingThumbnail ||
                      isUploadingContentImage ||
                      isSubmitting
                    }
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    {isUploadingThumbnail ? "업로드 중..." : "사진 변경"}
                  </Button>
                  <button
                    type="button"
                    disabled={isUploadingThumbnail || isSubmitting}
                    onClick={handleThumbnailRemove}
                    className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              ) : null}

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                disabled={
                  isUploadingThumbnail ||
                  isUploadingContentImage ||
                  isSubmitting
                }
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </div>
          ) : activeTab === "preview" ? (
            <div className="h-full overflow-y-auto px-5 py-5">
              {content.trim() || thumbnailUrl ? (
                <div className="space-y-5">
                  {thumbnailUrl ? (
                    <div className="relative h-56 overflow-hidden rounded-md sm:h-72">
                      <Image
                        src={thumbnailUrl}
                        alt="썸네일 미리보기"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  {content.trim() ? (
                    <MarkdownRenderer
                      content={content}
                      className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-[15px] leading-7"
                    />
                  ) : null}
                </div>
              ) : (
                <p className="text-[15px] leading-7 text-muted-foreground">
                  본문을 입력하면 여기에 미리보기가 표시됩니다.
                </p>
              )}
            </div>
          ) : (
            <textarea
              id="post-content"
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleContentKeyDown}
              rows={16}
              spellCheck={false}
              className="h-full w-full resize-none rounded-md bg-transparent px-5 py-5 font-mono text-[15px] leading-7 text-foreground outline-none placeholder:text-zinc-400"
              placeholder={"# 내용을 입력해 주세요."}
            />
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={
            isSubmitting || isUploadingThumbnail || isUploadingContentImage
          }
          onClick={() => router.back()}
          className="min-w-24"
        >
          취소
        </Button>

        <Button
          type="button"
          size="lg"
          disabled={
            isSubmitting || isUploadingThumbnail || isUploadingContentImage
          }
          onClick={handleSubmit}
          className="min-w-28"
        >
          {isSubmitting
            ? "게시 중..."
            : isUploadingThumbnail || isUploadingContentImage
              ? "업로드 중..."
              : "게시하기"}
        </Button>
      </div>
    </section>
  );
}
