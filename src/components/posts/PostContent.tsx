import Image from "next/image";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { DbPost } from "@/lib/db";

export default function PostContent({ post }: { post: DbPost }) {
  return (
    <section className="prose prose-neutral dark:prose-invert max-w-none">
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      >
        {post.content}
      </ReactMarkdown>
    </section>
  );
}
