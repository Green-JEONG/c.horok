import { EyeOff, Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getTechFaqPath,
  getTechFeedPostPath,
  getTechLikesPostPath,
  getTechNoticePath,
} from "@/lib/routes";
import { formatSeoulDate } from "@/lib/utils";

type Props = {
  id: number;
  title: string;
  description: string;
  category: string;
  author: string;
  authorImage?: string | null;
  likes: number;
  comments: number;
  createdAt: Date;
  thumbnail?: string | null;
  isHidden?: boolean;
  isSecret?: boolean;
  canViewSecret?: boolean;
  categoryBadgeText?: string;
  categoryBadgeClassName?: string;
  showCategoryBadge?: boolean;
  statusBadges?: Array<{
    text: string;
    className: string;
  }>;
  postRouteSection?: "feeds" | "likes";
  hrefOverride?: string;
  className?: string;
};

export default function PostCard({
  id,
  title,
  thumbnail,
  description,
  category,
  author,
  authorImage = null,
  likes,
  comments,
  createdAt,
  isHidden = false,
  isSecret = false,
  canViewSecret = true,
  categoryBadgeText,
  categoryBadgeClassName,
  showCategoryBadge = true,
  statusBadges = [],
  postRouteSection = "feeds",
  hrefOverride,
  className = "",
}: Props) {
  const isNotice = ["공지", "FAQ", "QnA"].includes(category);
  const isUncategorized = !category || category === "미분류";
  const href =
    hrefOverride ??
    (category === "FAQ"
      ? getTechFaqPath(id)
      : isNotice
        ? getTechNoticePath(id)
        : postRouteSection === "likes"
          ? getTechLikesPostPath(id)
          : getTechFeedPostPath(id));
  const defaultBadge = isUncategorized
    ? null
    : {
        text: `#${category}`,
        className: "border-border bg-background text-foreground",
      };
  const primaryBadge = statusBadges[0]
    ? statusBadges[0]
    : showCategoryBadge && defaultBadge
      ? {
          text: categoryBadgeText ?? defaultBadge.text,
          className: categoryBadgeClassName ?? defaultBadge.className,
        }
      : null;

  return (
    <Link
      href={href}
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="relative flex h-30 items-center justify-center bg-zinc-900">
        <Image
          src={thumbnail ?? "/thumbnails.png"}
          alt={title}
          fill
          unoptimized={Boolean(thumbnail)}
          className={`object-contain ${!thumbnail ? "p-8" : ""}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src={authorImage ?? "/logo.png"}
              alt={`${author} 프로필`}
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 rounded-full border object-cover"
            />
            <p className="truncate text-xs text-muted-foreground">{author}</p>
            {primaryBadge ? (
              <span
                className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${primaryBadge.className}`}
              >
                {primaryBadge.text}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-1 flex items-center gap-1.5">
          <h3 className="line-clamp-1 min-w-0 text-sm font-semibold">
            {title}
          </h3>
          {isHidden ? (
            <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : null}
          {isSecret ? (
            <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : null}
        </div>

        <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
          {isSecret && !canViewSecret ? "비밀글입니다." : description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 fill-current text-rose-500" />
              {likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {comments}
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap">
            {formatSeoulDate(createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
