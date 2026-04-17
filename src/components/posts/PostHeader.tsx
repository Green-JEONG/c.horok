import type { DbPost } from "@/lib/db";

export default function PostHeader({ post }: { post: DbPost }) {
  return (
    <header className="mb-3">
      <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span>{post.author_name}</span>
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
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
          #{post.category_name}
        </span>
      </div>

      <hr className="mt-6" />
    </header>
  );
}
