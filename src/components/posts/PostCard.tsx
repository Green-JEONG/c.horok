import { Lock } from "lucide-react";
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
  isSecret?: boolean;
  canViewSecret?: boolean;
  categoryBadgeText?: string;
  categoryBadgeClassName?: string;
  postRouteSection?: "feeds" | "likes";
};

function getDefaultNoticeBadge(category: string) {
  if (category === "QnA") {
    return {
      text: "#QnA",
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
    };
  }

  if (category === "FAQ") {
    return {
      text: "#FAQ",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
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
  isSecret = false,
  canViewSecret = true,
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
        {isSecret ? (
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>비밀글</span>
          </div>
        ) : null}
        {isHidden ? (
          <p className="mb-2 text-xs font-medium text-amber-600">숨김 처리됨</p>
        ) : null}

        <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
          {isSecret && !canViewSecret ? "비밀글입니다." : description}
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
