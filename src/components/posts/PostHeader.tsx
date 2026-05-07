import { Lock } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { DbPost } from "@/lib/db";

export default function PostHeader({
  post,
  actionSlot,
}: {
  post: DbPost;
  actionSlot?: ReactNode;
}) {
  const showSecretLock = post.is_secret;
  const showCategoryBadge =
    Boolean(post.category_name) && post.category_name !== "미분류";

  return (
    <header className="mb-3">
      <h1 className="flex items-center gap-2 text-3xl font-bold leading-tight">
        <span>{post.title}</span>
        {showSecretLock ? (
          <Lock className="h-6 w-6 shrink-0 text-muted-foreground" />
        ) : null}
      </h1>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Image
              src={post.author_image ?? "/logo.svg"}
              alt={`${post.author_name} 프로필`}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border object-cover"
            />
            <span>{post.author_name}</span>
          </span>
          <span>·</span>
          <span>
            <time>{new Date(post.created_at).toLocaleString("ko-KR")}</time>
            {post.updated_at.getTime() > post.created_at.getTime()
              ? " (수정)"
              : ""}
          </span>
          <span>·</span>
          <span>조회 {post.view_count}</span>
          {post.is_hidden ? (
            <>
              <span>·</span>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                숨김 상태
              </span>
            </>
          ) : null}
          {showCategoryBadge ? (
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              #{post.category_name}
            </span>
          ) : null}
        </div>

        {actionSlot ? (
          <div className="shrink-0 self-end sm:self-auto">{actionSlot}</div>
        ) : null}
      </div>

      <hr className="mt-2" />
    </header>
  );
}
