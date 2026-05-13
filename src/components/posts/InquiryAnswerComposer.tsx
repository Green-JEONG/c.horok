"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import CommentForm from "@/components/posts/CommentForm";

type Props = {
  postId: number;
  buttonLabel?: string;
  placeholder?: string;
  requiresLogin?: boolean;
  submitLabel?: string;
  showSecretOption?: boolean;
};

export default function InquiryAnswerComposer({
  postId,
  buttonLabel = "추가 답변하기",
  placeholder = "답변을 작성하세요",
  requiresLogin = false,
  submitLabel = "답변 등록",
  showSecretOption = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          if (requiresLogin) {
            window.alert("로그인 후 이용 가능합니다.");
            return;
          }

          setIsOpen((current) => !current);
        }}
        className="mx-auto flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        aria-expanded={isOpen}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition hover:border-primary/30 hover:bg-primary/10">
          <Plus
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-45" : ""}`}
            aria-hidden="true"
          />
        </span>
        <span>{buttonLabel}</span>
      </button>

      {isOpen ? (
        <div className="mt-3">
          <CommentForm
            postId={postId}
            placeholder={placeholder}
            submitLabel={submitLabel}
            variant="answer"
            showSecretOption={showSecretOption}
          />
        </div>
      ) : null}
    </div>
  );
}
