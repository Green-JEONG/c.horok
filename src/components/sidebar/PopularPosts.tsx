"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Image
          src="/fire.svg"
          alt="thumb"
          width={18}
          height={18}
          style={{ width: "auto", height: "auto" }}
        />
        <h3 className="text-sm font-semibold">인기</h3>
      </div>
      <ul className="space-y-2 text-sm">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}`}
              className="flex justify-between text-muted-foreground hover:text-foreground"
            >
              <span className="truncate">{post.title}</span>
              <span className="ml-2 text-xs">👁️ {post.viewCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
