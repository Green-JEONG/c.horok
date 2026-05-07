import Image from "next/image";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import type { DbPost } from "@/lib/db";

export default function PostContent({ post }: { post: DbPost }) {
  if (post.is_secret && !post.can_view_secret) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
        비밀글입니다. 작성자와 관리자만 내용을 확인할 수 있습니다.
      </section>
    );
  }

  return (
    <section>
      {post.thumbnail ? (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      ) : null}
      <MarkdownRenderer content={post.content} />
    </section>
  );
}
