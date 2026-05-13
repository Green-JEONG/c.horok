"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export default function RetryButton({ className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={cn(
        "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      다시 시도
    </button>
  );
}
