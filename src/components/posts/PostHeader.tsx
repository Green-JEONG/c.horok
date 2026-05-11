import { EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DbPost } from "@/lib/db";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import { formatSeoulDateTime } from "@/lib/utils";

export default function PostHeader({
  post,
  actionSlot,
  isOwner = false,
}: {
  post: DbPost;
  actionSlot?: ReactNode;
  isOwner?: boolean;
}) {
  const showSecretLock = post.is_secret;
  const showHiddenIcon = post.is_hidden;
  const showCategoryBadge =
    Boolean(post.category_name) &&
    post.category_name !== "미분류" &&
    !isNoticeCategoryName(post.category_name);
  const authorProfile = (
    <>
      <Image
        src={post.author_image ?? "/logo.png"}
        alt={`${post.author_name} 프로필`}
        width={24}
        height={24}
        className="h-6 w-6 rounded-full border object-cover"
      />
      <span>{post.author_name}</span>
    </>
  );

  return (
    <header className="mb-3">
      <h1 className="flex items-center gap-2 text-3xl font-bold leading-tight">
        <span>{post.title}</span>
        {showHiddenIcon ? (
          <EyeOff className="h-6 w-6 shrink-0 text-muted-foreground" />
        ) : null}
        {showSecretLock ? (
          <Lock className="h-6 w-6 shrink-0 text-muted-foreground" />
        ) : null}
      </h1>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.user_id ? (
            <Link
              href={isOwner ? "/horok-tech" : `/users/${post.user_id}`}
              className="inline-flex items-center gap-2 transition hover:text-foreground"
            >
              {authorProfile}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2">
              {authorProfile}
            </span>
          )}
          <span>·</span>
          <span>
            <time>{formatSeoulDateTime(post.created_at)}</time>
            {post.updated_at.getTime() > post.created_at.getTime()
              ? " (수정)"
              : ""}
          </span>
          <span>·</span>
          <span>조회 {post.view_count}</span>
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
