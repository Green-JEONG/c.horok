import Image from "next/image";
import MarkdownRenderer from "@/components/posts/MarkdownRenderer";
import type { DbPost } from "@/lib/db";

export default function PostContent({ post }: { post: DbPost }) {
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
