"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

export default function RecommendedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    // fetch("/api/categories/recommended")
    fetch("/api/categories/recommended")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Image src="/thumb.svg" alt="thumb" width={18} height={18} />
        <h3 className="text-sm font-semibold">카테고리</h3>
      </div>

      {categories.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          아직 작성된 게시글 태그가 없습니다.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                router.push(`/search?category=${encodeURIComponent(c.slug)}`)
              }
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
            >
              #{c.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
