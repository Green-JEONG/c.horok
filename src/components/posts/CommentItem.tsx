"use client";

import { useState } from "react";
import CommentForm from "./CommentForm";

export default function CommentItem() {
  const [replyOpen, setReplyOpen] = useState(false);
  const isOwner = true;

  return (
    <div className="rounded-md border p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium">정그린</span>
        <span className="text-muted-foreground">2026.01.08</span>
      </div>

      <p className="mt-2 text-sm">
        이 글 덕분에 App Router 구조가 확실히 정리됐어요 👍
      </p>

      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
        <button type="button" onClick={() => setReplyOpen((v) => !v)}>
          답글 달기
        </button>

        {isOwner && (
          <>
            <button type="button">수정</button>
            <button type="button" className="text-red-500">
              삭제
            </button>
          </>
        )}
      </div>

      {replyOpen && (
        <div className="ml-4 mt-3">
          <CommentForm placeholder="답글을 작성하세요" />
        </div>
      )}
    </div>
  );
}
