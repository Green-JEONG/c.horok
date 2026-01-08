"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PenSquare } from "lucide-react";

export default function HomeWriteButton() {
  const { status } = useSession();
  const router = useRouter();

  if (status !== "authenticated") return null;

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => router.push("/posts/new")}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
      >
        <PenSquare size={16} />글 작성
      </button>
    </div>
  );
}
