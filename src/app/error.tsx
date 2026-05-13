"use client";

import ErrorState from "@/components/common/ErrorState";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      code={500}
      message="요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      retryAction={
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          다시 시도
        </button>
      }
    />
  );
}
