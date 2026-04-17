import Image from "next/image";
import Link from "next/link";

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
};

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
}: Props) {
  return (
    <Link
      href={`/posts/${id}`}
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
        <p className="mb-1 truncate text-xs text-muted-foreground">
          {category} · {author}
        </p>

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
