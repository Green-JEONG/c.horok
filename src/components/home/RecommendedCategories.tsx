"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

export default function RecommendedCategories() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    const userPageMatch = pathname.match(/^\/users\/(\d+)$/);
    const currentUserId = session?.user?.id;
    const endpoint = userPageMatch
      ? `/api/categories/recommended?userId=${userPageMatch[1]}`
      : pathname === "/mypage" && currentUserId
        ? `/api/categories/recommended?userId=${currentUserId}`
        : "/api/categories/recommended";

    fetch(endpoint)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, [pathname, session?.user?.id]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Image src="/thumb.svg" alt="thumb" width={18} height={18} />
        <h3 className="text-lg font-bold tracking-tight">카테고리</h3>
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
              onClick={() => {
                const userPageMatch = pathname.match(/^\/users\/(\d+)$/);

                if (userPageMatch) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("category", c.slug);
                  router.push(
                    `/users/${userPageMatch[1]}?${params.toString()}`,
                  );
                  return;
                }

                if (pathname === "/mypage" && session?.user?.id) {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("category", c.slug);
                  router.push(`/mypage?${params.toString()}`);
                  return;
                }

                router.push(`/search?category=${encodeURIComponent(c.slug)}`);
              }}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
            >
              #{c.name.toLocaleLowerCase()}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
