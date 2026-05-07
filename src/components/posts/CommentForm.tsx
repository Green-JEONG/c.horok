"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";

type AnswerEditorTab = "write" | "preview";

const answerMarkdownTools = [
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
  { label: "인용", action: "quote" },
  { label: "목록", action: "list" },
  { label: "번호목록", action: "orderedList" },
  { label: "체크", action: "checklist" },
  { label: "코드블록", action: "codeblock" },
  { label: "표", action: "table" },
  { label: "구분선", action: "divider" },
  { label: "링크", action: "link" },
] as const;

type AnswerMarkdownAction = (typeof answerMarkdownTools)[number]["action"];

export default function CommentForm({
  postId,
  parentId = null,
  placeholder = "댓글을 작성하세요",
  initialIsSecret = false,
  submitLabel = "등록",
  variant = "default",
  showSecretOption = true,
}: {
  postId: number;
  parentId?: number | null;
  placeholder?: string;
  initialIsSecret?: boolean;
  submitLabel?: string;
  variant?: "default" | "answer";
  showSecretOption?: boolean;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(initialIsSecret);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnswerEditorTab>("write");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: trimmedContent,
          parentId,
          isSecret,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "댓글 등록에 실패했습니다.");
        return;
      }

      setContent("");
      setIsSecret(initialIsSecret);
      router.refresh();
    } catch {
      setError("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAnswerVariant = variant === "answer";

  function updateContentWithSelection(
    nextContent: string,
    selectionStart: number,
    selectionEnd = selectionStart,
  ) {
    setContent(nextContent);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function wrapSelection(
    prefix: string,
    suffix = prefix,
    placeholder = "",
    selectWrapped = false,
  ) {
    const textarea = textareaRef.current;
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

  function prefixSelectedLines(prefix: string, placeholder: string) {
    const textarea = textareaRef.current;
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

  function wrapSelectedBlock(
    prefix: string,
    suffix: string,
    placeholder: string,
  ) {
    const textarea = textareaRef.current;
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

  function insertTextAtCursor(text: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent((prev) => `${prev}${prev ? "\n\n" : ""}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const nextContent = `${before}${text}${after}`;
    const nextCursorPosition = start + text.length;

    updateContentWithSelection(nextContent, nextCursorPosition);
  }

  function applyAnswerMarkdownTool(action: AnswerMarkdownAction) {
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
        wrapSelection("**", "**", "강조할 내용", true);
        break;
      case "italic":
        wrapSelection("*", "*", "기울일 내용", true);
        break;
      case "strike":
        wrapSelection("~~", "~~", "취소선을 넣을 내용", true);
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
      case "codeblock":
        wrapSelection("```tsx\n", "\n```", "코드를 입력하세요", true);
        break;
      case "table":
        insertTextAtCursor(
          "| 항목 | 내용 |\n| --- | --- |\n| 예시 | 값을 입력하세요 |",
        );
        break;
      case "divider":
        insertTextAtCursor("\n---\n");
        break;
      case "link":
        wrapSelection("[", "](https://)", "링크 텍스트", true);
        break;
    }
  }

  function renderAnswerTabButton(tab: AnswerEditorTab, label: ReactNode) {
    const isActive = activeTab === tab;

    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`w-20 border-b-2 px-1 pb-2 text-center text-sm font-medium transition ${
          isActive
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <form
      className={
        isAnswerVariant
          ? "mt-6 rounded-xl border bg-muted/20 p-4"
          : "mt-6 space-y-2"
      }
      onSubmit={handleSubmit}
    >
      {isAnswerVariant ? (
        <div className="space-y-3">
          <div className="flex items-center border-b border-border/70">
            {renderAnswerTabButton("write", "본문")}
            {renderAnswerTabButton("preview", "미리보기")}
          </div>

          {activeTab === "write" ? (
            <div className="flex flex-wrap gap-2">
              {answerMarkdownTools.map((tool) => (
                <button
                  key={tool.action}
                  type="button"
                  onClick={() => applyAnswerMarkdownTool(tool.action)}
                  className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {tool.label}
                </button>
              ))}
            </div>
          ) : null}

          {activeTab === "preview" ? (
            <div className="min-h-56 rounded-lg border border-border/80 bg-background px-5 py-4">
              {content.trim() ? (
                <MarkdownRenderer
                  content={content}
                  className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  답변을 입력하면 여기에 미리보기가 표시됩니다.
                </p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-56 w-full resize-none rounded-lg border border-border/80 bg-background px-5 py-4 text-sm leading-7 outline-none placeholder:text-zinc-400"
              rows={10}
              placeholder={placeholder}
            />
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full rounded-md border p-3 text-sm"
          rows={3}
          placeholder={placeholder}
        />
      )}

      <div
        className={`flex items-center ${showSecretOption ? "justify-between" : "justify-end"} gap-3 ${
          isAnswerVariant ? "mt-3" : ""
        }`}
      >
        {showSecretOption ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(event) => setIsSecret(event.target.checked)}
              className="h-4 w-4"
            />
            <span>비밀댓글</span>
          </label>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded-md bg-primary text-white disabled:cursor-not-allowed disabled:opacity-60 ${
            isAnswerVariant
              ? "px-5 py-2 text-sm font-medium"
              : "px-4 py-1.5 text-sm"
          }`}
        >
          {isSubmitting ? `${submitLabel} 중...` : submitLabel}
        </button>
      </div>

      {error ? (
        <p className={`text-sm text-red-500 ${isAnswerVariant ? "mt-3" : ""}`}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
