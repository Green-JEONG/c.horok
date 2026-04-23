"use client";

import { PenSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTechFeedNewPostPath } from "@/lib/routes";

type HomeWriteButtonProps = {
  href?: string;
  label?: string;
};

export default function HomeWriteButton({
  href = getTechFeedNewPostPath(),
  label = "글 작성",
}: HomeWriteButtonProps) {
  const { status } = useSession();
  const router = useRouter();

  if (status !== "authenticated") return null;

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => router.push(href)}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow transition-colors hover:opacity-90"
      >
        <PenSquare size={16} />
        {label}
      </button>
    </div>
  );
}
