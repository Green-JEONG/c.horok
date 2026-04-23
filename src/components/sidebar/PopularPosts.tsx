"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTechFeedPostPath } from "@/lib/routes";

type PopularPost = {
  id: number;
  title: string;
  viewCount: number;
};

export default function PopularPosts() {
  const [posts, setPosts] = useState<PopularPost[]>([]);

  useEffect(() => {
    fetch("/api/posts/popular")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <section className="-mx-6 px-6 space-y-3">
      <div className="flex items-center gap-2">
        <Image
          src="/fire.svg"
          alt="thumb"
          width={18}
          height={18}
          style={{ width: "auto", height: "auto" }}
        />
        <h3 className="text-lg font-bold tracking-tight">인기</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link
              href={getTechFeedPostPath(post.id)}
              className="flex items-start gap-1 overflow-hidden text-muted-foreground hover:text-foreground"
            >
              <span className="min-w-4 text-sm font-semibold tabular-nums text-foreground/80">
                {index + 1}
              </span>
              <span className="block truncate">{post.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
