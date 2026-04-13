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

export default function MyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
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
