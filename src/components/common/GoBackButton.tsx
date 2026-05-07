"use client";

import { useRouter } from "next/navigation";

export default function GoBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push("/");
      }}
      className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      이전 페이지로
    </button>
  );
}
