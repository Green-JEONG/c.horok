import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mypage | c.horok",
  description: "마이 페이지",
  robots: {
    index: false,
    follow: false,
  },
};

import { Suspense } from "react";
import MyPageSection from "@/components/mypage/MyPageSection";
import { getCategoryBySlug } from "@/lib/categories";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function MyPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const categorySlug = category?.trim();
  const selectedCategory = categorySlug
    ? await getCategoryBySlug(categorySlug, { requireVisiblePosts: false })
    : null;

  return (
    <div className="w-full space-y-12">
      {selectedCategory ? (
        <h1 className="inline-flex min-w-0 items-center gap-1 text-lg font-semibold">
          <span className="truncate">마이 홈</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="shrink-0">카테고리</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selectedCategory.name}</span>
        </h1>
      ) : (
        <h1 className="text-lg font-semibold">마이페이지</h1>
      )}
      <Suspense fallback={<MyPageLoading />}>
        <MyPageSection />
      </Suspense>
    </div>
  );
}

function MyPageLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 rounded bg-muted animate-pulse" />
      <div className="h-48 rounded bg-muted animate-pulse" />
      <div className="h-48 rounded bg-muted animate-pulse" />
    </div>
  );
}
