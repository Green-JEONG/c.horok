import Image from "next/image";
import Link from "next/link";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import {
  getTechFeedPostPath,
  getTechLikesPostPath,
  getTechNoticePath,
} from "@/lib/routes";

type Props = {
  id: number;
  title: string;
  description: string;
  category: string;
  author: string;
  likes: number;
  comments: number;
  createdAt: Date;
  thumbnail?: string | null;
  isHidden?: boolean;
  categoryBadgeText?: string;
  categoryBadgeClassName?: string;
  postRouteSection?: "feeds" | "likes";
};

function getDefaultNoticeBadge(category: string) {
  if (category === "긴급") {
    return {
      text: "#긴급",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    };
  }

  if (category === "중요") {
    return {
      text: "#중요",
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    };
  }

  return {
    text: "#공지",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  };
}

export default function PostCard({
  id,
  title,
  thumbnail,
  description,
  category,
  author,
  likes,
  comments,
  createdAt,
  isHidden = false,
  categoryBadgeText,
  categoryBadgeClassName,
  postRouteSection = "feeds",
}: Props) {
  const isNotice = isNoticeCategoryName(category);
  const href = isNotice
    ? getTechNoticePath(id)
    : postRouteSection === "likes"
      ? getTechLikesPostPath(id)
      : getTechFeedPostPath(id);
  const defaultBadge = isNotice
    ? getDefaultNoticeBadge(category)
    : {
        text: `#${category}`,
        className: "border-border bg-background text-foreground",
      };

  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative flex h-30 items-center justify-center bg-zinc-900">
        <Image
          src={thumbnail ?? "/thumbnails/default.png"}
          alt={title}
          fill
          unoptimized={Boolean(thumbnail)}
          className={`object-contain ${!thumbnail ? "p-8" : ""}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              categoryBadgeClassName ?? defaultBadge.className
            }`}
          >
            {categoryBadgeText ?? defaultBadge.text}
          </span>
          <p className="truncate text-xs text-muted-foreground">{author}</p>
        </div>

        <h3 className="mb-1 line-clamp-1 text-sm font-semibold">{title}</h3>
        {isHidden ? (
          <p className="mb-2 text-xs font-medium text-amber-600">숨김 처리됨</p>
        ) : null}

        <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1">
            <span>❤️ {likes}</span>
            <span>💬 {comments}</span>
          </div>
          <span className="shrink-0 whitespace-nowrap">
            {new Date(createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
