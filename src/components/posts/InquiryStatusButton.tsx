"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type InquiryStatus = "checking" | "resolved";

export default function InquiryStatusButton({
  postId,
  status,
  initialActive = false,
  canManage,
}: {
  postId: number;
  status: InquiryStatus;
  initialActive?: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const isResolvedButton = status === "resolved";

  async function updateStatus() {
    if (!canManage || isUpdating) {
      return;
    }

    const nextStatus = isResolvedButton && isActive ? "checking" : status;
    const nextActive = isResolvedButton ? nextStatus === "resolved" : true;
    const previousActive = isActive;
    setIsActive(nextActive);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inquiryStatus: nextStatus }),
      });

      if (!response.ok) {
        setIsActive(previousActive);
        return;
      }

      router.refresh();
    } catch {
      setIsActive(previousActive);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isResolvedButton) {
    return (
      <button
        type="button"
        disabled={!canManage || isUpdating}
        onClick={updateStatus}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors disabled:cursor-not-allowed ${
          isActive
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/60 bg-background text-transparent hover:border-green-500 hover:text-green-500"
        }`}
        aria-pressed={isActive}
        aria-label="문의 해결 완료"
        title={
          canManage
            ? isActive
              ? "해결 완료 취소"
              : "해결 완료로 변경"
            : "관리자만 변경할 수 있습니다."
        }
      >
        <Check className="h-4 w-4 stroke-[3]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!canManage || isUpdating || isActive}
      onClick={updateStatus}
      className={`inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
        isActive
          ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-pressed={isActive}
      aria-label="문의 확인 중"
      title={canManage ? "확인 중으로 변경" : "관리자만 변경할 수 있습니다."}
    >
      👀
    </button>
  );
}
